import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { referralNextAction } from "../shared/referralWorkflow";
import {
  assertWorkflowAccess,
  referralWorkflowRouter,
  workflowEntryInput,
} from "./referralWorkflowRouter";
import { referralWorkflowEvents } from "../drizzle/schema";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));
const context = (role = "user", id = 7) =>
  ({
    user: { id, role, userType: "handyman" },
    req: {},
    res: {},
  }) as TrpcContext;
const quote = (status: string) => ({ status, expiresAt: null });
const now = new Date("2026-11-06T12:00:00Z");

describe("referral next actions", () => {
  it("keeps approved quotes distinct from secured payments", () => {
    expect(
      referralNextAction("awaiting_payment", [], [quote("approved")])
    ).toContain("not yet secured");
    expect(
      referralNextAction("awaiting_payment", [], [quote("paid")])
    ).toContain("Payment secured");
  });
  it("does not ask for follow-up on closed referrals", () => {
    for (const status of ["completed", "cancelled"])
      expect(
        referralNextAction(status, [], [quote("payment_failed")])
      ).toBeNull();
  });
  it("works with existing referrals that have no activity entries", () => {
    expect(referralNextAction("sent", [], [])).toContain("handyman response");
    expect(referralNextAction("accepted", [], [])).toContain(
      "Contact the homeowner"
    );
    expect(referralNextAction("accepted", [], [quote("draft")])).toContain(
      "Draft quote saved"
    );
  });
  it("distinguishes an upcoming visit from a visit needing an outcome", () => {
    const event = {
      kind: "visit_booked",
      createdAt: now,
      scheduledAt: new Date("2026-11-07"),
    };
    expect(referralNextAction("accepted", [event], [], now)).toContain(
      "awaiting the scheduled visit"
    );
    expect(
      referralNextAction("accepted", [event], [], new Date("2026-11-08"))
    ).toContain("confirm the outcome");
  });
  it("uses the replacement quote instead of an older failed attempt", () => {
    expect(
      referralNextAction(
        "quote_sent",
        [],
        [
          { id: 1, ...quote("payment_failed") },
          { id: 2, ...quote("sent") },
        ]
      )
    ).toContain("Awaiting homeowner quote approval");
  });
  it("flags an elapsed quote even before its stored status changes", () => {
    expect(
      referralNextAction(
        "quote_sent",
        [],
        [{ status: "sent", expiresAt: new Date("2026-11-01") }],
        now
      )
    ).toContain("expired");
  });
});

describe("workflow permissions and input", () => {
  it("denies unassigned, pending, declined and cancelled handyman access", () => {
    for (const status of ["sent", "declined", "cancelled"])
      expect(() =>
        assertWorkflowAccess(context().user!, { handymanId: 7, status })
      ).toThrow();
    expect(() =>
      assertWorkflowAccess(context().user!, {
        handymanId: 8,
        status: "accepted",
      })
    ).toThrow();
    expect(() =>
      assertWorkflowAccess(context().user!, {
        handymanId: 7,
        status: "accepted",
      })
    ).not.toThrow();
  });
  it("requires an outreach candidate, visit time and nonempty freeform notes", () => {
    for (const kind of ["outreach_sent", "visit_booked", "note"])
      expect(
        workflowEntryInput.safeParse({ referralJobId: 1, kind }).success
      ).toBe(false);
    expect(
      workflowEntryInput.safeParse({
        referralJobId: 1,
        kind: "customer_contacted",
        candidateId: 2,
      }).success
    ).toBe(false);
  });
});

describe("workflow API isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("REFERRAL_WORKFLOW_ENABLED", "true");
  });
  afterEach(() => vi.unstubAllEnvs());
  it("does not access the database when disabled", async () => {
    vi.stubEnv("REFERRAL_WORKFLOW_ENABLED", "false");
    const caller = referralWorkflowRouter.createCaller(context());
    expect(await caller.config()).toEqual({ enabled: false });
    await expect(caller.get({ referralJobId: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      caller.add({ referralJobId: 1, kind: "customer_contacted" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(getDb).not.toHaveBeenCalled();
  });
  it("limits the admin overview to admins", async () => {
    await expect(
      referralWorkflowRouter.createCaller(context()).summary()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getDb).not.toHaveBeenCalled();
  });
  function fakeDb(status = "accepted", handymanId = 7) {
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValue({ values });
    const tx = {
      select: () => ({
        from: () => ({
          where: () => ({
            for: () => Promise.resolve([{ id: 1, handymanId, status }]),
          }),
        }),
      }),
      insert,
    };
    vi.mocked(getDb).mockResolvedValue({
      transaction: (fn: (tx: unknown) => unknown) => fn(tx),
    } as never);
    return { insert, values };
  }
  it("only appends an activity record and does not update referral or quote state", async () => {
    const { insert, values } = fakeDb();
    await referralWorkflowRouter
      .createCaller(context())
      .add({
        referralJobId: 1,
        kind: "customer_contacted",
        note: "Confirmed scope",
      });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(referralWorkflowEvents);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        referralJobId: 1,
        actorId: 7,
        adminOnly: false,
      })
    );
  });
  it("keeps admin notes private", async () => {
    const { values } = fakeDb();
    await referralWorkflowRouter
      .createCaller(context("admin"))
      .add({ referralJobId: 1, kind: "note", note: "Internal follow-up" });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ adminOnly: true })
    );
  });
  it("rejects updates after the referral leaves the accepted stage", async () => {
    const { insert } = fakeDb("awaiting_payment");
    await expect(
      referralWorkflowRouter
        .createCaller(context())
        .add({ referralJobId: 1, kind: "customer_contacted" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(insert).not.toHaveBeenCalled();
  });
  it("prevents a handyman from logging outreach or another handyman's progress", async () => {
    let db = fakeDb();
    await expect(
      referralWorkflowRouter
        .createCaller(context())
        .add({ referralJobId: 1, kind: "outreach_sent", candidateId: 8 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.insert).not.toHaveBeenCalled();
    db = fakeDb("accepted", 8);
    await expect(
      referralWorkflowRouter
        .createCaller(context())
        .add({ referralJobId: 1, kind: "customer_contacted" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
