import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { referralIneligibility } from "../shared/referralEligibility";
import { createReferralJob, closeDb } from "./db";
import { referralAssignmentsRouter } from "./referralAssignments";
import {
  users,
  handymanProfiles,
  referralJobs,
  referralAssignmentRestrictions,
} from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ db: {} as any, pool: { end: vi.fn() } }));
vi.mock("drizzle-orm/mysql2", () => ({ drizzle: () => mocks.db }));
vi.mock("mysql2/promise", () => ({
  default: { createPool: () => mocks.pool },
}));
const input = {
  createdByAdminId: 1,
  handymanId: 7,
  homeownerName: "Test",
  title: "Test repair",
  description: "Test repair scope",
  category: "Repairs",
  photos: ["https://example.com/photo.jpg"],
};
let account: any, profile: any, restriction: any, insert: any, values: any;
beforeEach(async () => {
  await closeDb();
  vi.stubEnv("DATABASE_URL", "mysql://test@localhost/unused");
  account = { id: 7, userType: "handyman" };
  profile = { identityVerificationStatus: "approved" };
  restriction = undefined;
  values = vi.fn().mockResolvedValue([{ insertId: 123 }]);
  insert = vi.fn().mockReturnValue({ values });
  const tx = {
    insert,
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          const rows =
            table === users
              ? account
                ? [account]
                : []
              : table === handymanProfiles
                ? profile
                  ? [profile]
                  : []
                : table === referralAssignmentRestrictions
                  ? restriction
                    ? [restriction]
                    : []
                  : [];
          return {
            for: vi.fn().mockResolvedValue(rows),
            then: (resolve: any) => Promise.resolve(rows).then(resolve),
          };
        },
      }),
    }),
  };
  mocks.db = { transaction: (fn: any) => fn(tx) };
});
afterEach(() => vi.unstubAllEnvs());

describe("referral assignment eligibility", () => {
  it.each(["not_submitted", "pending", "rejected", null])(
    "rejects identity status %s without inserting",
    async status => {
      profile = status ? { identityVerificationStatus: status } : undefined;
      await expect(createReferralJob(input)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(insert).not.toHaveBeenCalled();
    }
  );
  it.each(["suspended", "blocked"])(
    "rejects %s referral access even with approved identity",
    async status => {
      restriction = { status };
      await expect(createReferralJob(input)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(insert).not.toHaveBeenCalled();
    }
  );
  it("rejects deleted and non-handyman accounts", async () => {
    account = undefined;
    await expect(createReferralJob(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    account = { id: 7, userType: "homeowner" };
    await expect(createReferralJob(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(insert).not.toHaveBeenCalled();
  });
  it("creates one new referral with its existing commission and photos", async () => {
    expect(await createReferralJob(input)).toBe(123);
    expect(insert).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledWith(referralJobs);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        commissionRate: "20.00",
        sourceType: "saskhandy_referral",
        status: "sent",
        photos: JSON.stringify(input.photos),
      })
    );
  });
  it("rechecks identity instead of trusting a previously eligible dropdown", async () => {
    expect(
      referralIneligibility({ ...account, ...profile, referralAccess: null })
    ).toBeNull();
    profile.identityVerificationStatus = "pending";
    await expect(createReferralJob(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(insert).not.toHaveBeenCalled();
  });
  it("does not substitute other verification badges for ID Name Matched", () => {
    expect(
      referralIneligibility({
        userType: "handyman",
        identityVerificationStatus: "pending",
        referralAccess: "active",
      })
    ).toBe("ID Name Matched required");
  });
  it("restricts eligibility and moderation endpoints to admins", async () => {
    const caller = referralAssignmentsRouter.createCaller({
      user: { id: 7, role: "user", userType: "handyman" },
      req: {},
      res: {},
    } as TrpcContext);
    await expect(caller.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.setAccess({ userId: 7, status: "blocked" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
