import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import { getDb, closeDb } from "./db";
import {
  users,
  handymanProfiles,
  referralJobs,
  quotes,
} from "../drizzle/schema";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const payment = vi.hoisted(() => ({
  status: "requires_payment_method",
  quoteId: "",
  calls: 0,
}));
vi.mock("./stripe", () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(async () => {
        payment.calls++;
        return { id: "pi_disposable", client_secret: "test_only" };
      }),
    },
  },
  retrievePaymentIntent: vi.fn(async () => ({
    id: "pi_disposable",
    status: payment.status,
    client_secret: "test_only",
    metadata: { quoteId: payment.quoteId },
  })),
  createPaymentIntent: vi.fn(),
}));
vi.mock("./sms", async importOriginal => ({
  ...(await importOriginal<typeof import("./sms")>()),
  sendTransactionalSms: vi.fn().mockResolvedValue(undefined),
}));
vi.mock(
  "./email",
  () =>
    new Proxy(
      {},
      {
        get: (_, name) =>
          name === "then" ? undefined : vi.fn().mockResolvedValue(undefined),
      }
    )
);

const enabled = process.env.REFERRAL_INTEGRATION_TEST === "true";
describe.skipIf(!enabled)("isolated MySQL referral integration", () => {
  let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
  let connection: mysql.Connection;
  const caller = (id: number, role = "user") =>
    appRouter.createCaller({
      user: {
        id,
        role,
        userType: "handyman",
        name: "Synthetic user",
        email: null,
      },
      req: {},
      res: {},
    } as TrpcContext);
  const admin = caller(91001, "admin");
  const handyman = caller(91002);
  const input = {
    handymanId: 91002,
    homeownerName: "Synthetic customer",
    homeownerPhone: "+13065550100",
    title: "Synthetic ceiling repair",
    description: "Synthetic scope for isolated verification",
    category: "Repairs",
  };
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (
      url.hostname !== "127.0.0.1" ||
      url.pathname !== "/saskhandy_workflow_test"
    )
      throw Error(
        "Integration tests require the disposable localhost database"
      );
    db = (await getDb())!;
    connection = await mysql.createConnection(process.env.DATABASE_URL!);
    await db.insert(users).values([
      { id: 91001, openId: "ci-admin", role: "admin", userType: "handyman" },
      { id: 91002, openId: "ci-handyman", userType: "handyman" },
      { id: 91003, openId: "ci-other", userType: "handyman" },
    ]);
    await db
      .insert(handymanProfiles)
      .values({ userId: 91002, identityVerificationStatus: "approved" });
    await db
      .insert(referralJobs)
      .values({
        id: 91000,
        createdByAdminId: 91001,
        handymanId: 91002,
        homeownerName: "Existing synthetic customer",
        title: "Existing active job",
        description: "Do not modify",
        category: "Repairs",
        status: "in_progress",
      });
    await db
      .insert(quotes)
      .values({
        id: 91000,
        handymanId: 91002,
        referralJobId: 91000,
        sourceType: "saskhandy_referral",
        homeownerName: "Existing synthetic customer",
        title: "Existing paid quote",
        scope: "Do not modify",
        subtotal: "100.00",
        totalAmount: "105.00",
        platformFeeRate: "20.00",
        platformFeeAmount: "20.00",
        status: "paid",
        publicToken: "a".repeat(64),
      });
    // Only the explicitly disposable CI schema may be reset; no production credentials are used.
    await connection.query(
      "DROP TABLE referral_workflow_events, referral_assignment_restrictions"
    );
  });
  afterAll(async () => {
    await connection?.end();
    await closeDb();
  });
  it("applies both additive migrations twice without changing existing referrals", async () => {
    const [before] = await connection.query(
      "SELECT * FROM referral_jobs WHERE id=91000"
    );
    const [quotesBefore] = await connection.query(
      "SELECT * FROM quotes WHERE id=91000"
    );
    for (let pass = 0; pass < 2; pass++)
      for (const name of [
        "referral-workflow",
        "referral-assignment-restrictions",
      ])
        await connection.execute(
          readFileSync(`scripts/sql/${name}.sql`, "utf8")
        );
    const [after] = await connection.query(
      "SELECT * FROM referral_jobs WHERE id=91000"
    );
    expect(after).toEqual(before);
    const [quotesAfter] = await connection.query(
      "SELECT * FROM quotes WHERE id=91000"
    );
    expect(quotesAfter).toEqual(quotesBefore);
  });
  it("enforces current eligibility and retains existing assignments", async () => {
    expect(
      (await admin.referralAssignments.list()).find(p => p.userId === 91002)
        ?.ineligibleReason
    ).toBeNull();
    await admin.referralAssignments.setAccess({
      userId: 91002,
      status: "blocked",
    });
    await expect(admin.admin.createReferralJob(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(
      (
        await db.select().from(referralJobs).where(eq(referralJobs.id, 91000))
      )[0].handymanId
    ).toBe(91002);
    await admin.referralAssignments.setAccess({
      userId: 91002,
      status: "active",
    });
    await db
      .update(handymanProfiles)
      .set({ identityVerificationStatus: "pending" })
      .where(eq(handymanProfiles.userId, 91002));
    await expect(admin.admin.createReferralJob(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await db
      .update(handymanProfiles)
      .set({ identityVerificationStatus: "approved" })
      .where(eq(handymanProfiles.userId, 91002));
  });
  it("preserves the referral-to-quote/payment path with simulated external providers", async () => {
    const { referralJobId } = await admin.admin.createReferralJob(input);
    expect(referralJobId).toBeGreaterThan(0);
    await handyman.referralJobs.accept({ referralJobId });
    await admin.referralWorkflow.add({
      referralJobId,
      kind: "note",
      note: "Private admin fixture",
    });
    await handyman.referralWorkflow.add({
      referralJobId,
      kind: "customer_contacted",
      note: "Confirmed scope",
    });
    await handyman.referralWorkflow.add({
      referralJobId,
      kind: "visit_booked",
      scheduledAt: new Date(Date.now() + 86400000),
    });
    expect(
      (await handyman.referralWorkflow.get({ referralJobId })).events
    ).toHaveLength(2);
    expect(
      (await admin.referralWorkflow.get({ referralJobId })).events
    ).toHaveLength(3);
    await expect(
      caller(91003).referralWorkflow.get({ referralJobId })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const created = await handyman.quotes.create({
      referralJobId,
      title: input.title,
      scope: input.description,
      subtotal: 200,
      gstRate: 5,
      pstRate: 6,
    });
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, created.quoteId));
    expect(quote.homeownerName).toBe(input.homeownerName);
    expect(quote.platformFeeAmount).toBe("40.00");
    expect(quote.totalAmount).toBe("222.00");
    expect(quote.status).toBe("draft");
    const token = created.publicToken;
    const publicApi = appRouter.createCaller({
      user: null,
      req: {},
      res: {},
    } as TrpcContext);
    await expect(
      publicApi.stripe.createQuotePaymentIntent({ token })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await handyman.quotes.send({
      quoteId: created.quoteId,
      confirmSmsPermission: true,
    });
    expect((await publicApi.quotes.getPublic({ token })).status).toBe("viewed");
    await publicApi.quotes.respond({ token, decision: "approved" });
    expect(
      (await admin.referralWorkflow.get({ referralJobId })).nextAction
    ).toContain("not yet secured");
    await expect(
      handyman.quotes.complete({ quoteId: created.quoteId })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    payment.quoteId = String(created.quoteId);
    await publicApi.stripe.createQuotePaymentIntent({ token });
    expect(payment.calls).toBe(1);
    expect((await publicApi.stripe.confirmQuotePayment({ token })).status).toBe(
      "payment_failed"
    );
    payment.status = "succeeded";
    expect((await publicApi.stripe.confirmQuotePayment({ token })).status).toBe(
      "paid"
    );
    expect(
      (await admin.referralWorkflow.get({ referralJobId })).nextAction
    ).toContain("Payment secured");
    await handyman.quotes.complete({ quoteId: created.quoteId });
    expect(
      (await admin.referralWorkflow.get({ referralJobId })).nextAction
    ).toBeNull();
    const [existing] = await db
      .select()
      .from(referralJobs)
      .where(eq(referralJobs.id, 91000));
    expect(existing.status).toBe("in_progress");
  });
});
