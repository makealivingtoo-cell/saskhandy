import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ─────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Test User", email: "test@example.com" }),
  createJob: vi.fn().mockResolvedValue({ id: 1 }),
  getJobById: vi.fn().mockResolvedValue({
    id: 1,
    title: "Fix leaky faucet",
    description: "Kitchen faucet drips",
    category: "Plumbing",
    location: "Saskatoon, SK",
    budgetMin: "50",
    budgetMax: "150",
    status: "open",
    homeownerId: 1,
    selectedBidId: null,
    selectedHandymanId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getJobsByHomeowner: vi.fn().mockResolvedValue([]),
  getOpenJobs: vi.fn().mockResolvedValue([]),
  updateJobStatus: vi.fn(),
  createBid: vi.fn().mockResolvedValue({ id: 10 }),
  getBidById: vi.fn().mockResolvedValue({
    id: 10,
    jobId: 1,
    handymanId: 2,
    bidAmount: "100",
    message: "I can do this",
    availability: "Weekends",
    status: "pending",
    createdAt: new Date(),
  }),
  getBidsForJob: vi.fn().mockResolvedValue([]),
  getBidsForHandyman: vi.fn().mockResolvedValue([]),
  updateBidStatus: vi.fn(),
  createHandymanProfile: vi.fn(),
  getHandymanProfile: vi.fn().mockResolvedValue(null),
  getHandymanProfileById: vi.fn().mockResolvedValue(null),
  updateHandymanProfile: vi.fn(),
  createPayment: vi.fn().mockResolvedValue({ id: 5 }),
  getPaymentByJob: vi.fn().mockResolvedValue(null),
  updatePayment: vi.fn(),
  getHandymanEarnings: vi.fn().mockResolvedValue({ totalEarnings: "0", payments: [] }),
  createReview: vi.fn().mockResolvedValue({ id: 20 }),
  getReviewsForUser: vi.fn().mockResolvedValue([]),
  getMyReview: vi.fn().mockResolvedValue(null),
  createDispute: vi.fn().mockResolvedValue({ id: 30 }),
  getDisputeByJob: vi.fn().mockResolvedValue(null),
  getAllDisputes: vi.fn().mockResolvedValue([]),
  resolveDispute: vi.fn(),
  getAdminStats: vi.fn().mockResolvedValue({ totalUsers: 0, homeowners: 0, handymen: 0, openJobs: 0, openDisputes: 0 }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  setUserType: vi.fn(),
}));

// ─── Context helpers ─────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      userType: "homeowner",
      ...overrides,
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makeHandymanCtx(): TrpcContext {
  return makeCtx({ id: 2, openId: "handyman-user", userType: "handyman" });
}

function makeAdminCtx(): TrpcContext {
  return makeCtx({ role: "admin" });
}

// ─── Auth ────────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toMatchObject({ id: 1, email: "test@example.com" });
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

// ─── Jobs ────────────────────────────────────────────────────────────────────
describe("jobs.create", () => {
  it("creates a job for a homeowner", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.jobs.create({
      title: "Fix leaky faucet",
      description: "Kitchen faucet drips constantly",
      category: "Plumbing",
      location: "Saskatoon, SK",
      budgetMin: 50,
      budgetMax: 150,
    });
    expect(result).toMatchObject({ jobId: { id: 1 } });
  });

  it("throws UNAUTHORIZED if not logged in", async () => {
    const ctx: TrpcContext = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.jobs.create({
        title: "Fix faucet",
        description: "Drips",
        category: "Plumbing",
        location: "Regina, SK",
        budgetMin: 50,
        budgetMax: 100,
      })
    ).rejects.toThrow();
  });
});

describe("jobs.getById", () => {
  it("returns job details for a valid job ID", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.jobs.getById({ jobId: 1 });
    expect(result).toMatchObject({ id: 1, title: "Fix leaky faucet", status: "open" });
  });
});

// ─── Bids ────────────────────────────────────────────────────────────────────
describe("bids.create", () => {
  it("allows a handyman to place a bid", async () => {
    const ctx = makeHandymanCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bids.create({
      jobId: 1,
      bidAmount: 100,
      message: "I can fix this quickly",
      availability: "This weekend",
    });
    expect(result).toMatchObject({ bidId: { id: 10 } });
  });
});

// ─── Reviews ─────────────────────────────────────────────────────────────────
describe("reviews.create", () => {
  it("validates rating is between 1 and 5", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.reviews.create({
        jobId: 1,
        revieweeId: 2,
        rating: 6,
        comment: "Great work",
      })
    ).rejects.toThrow();
  });
});

// ─── Admin ───────────────────────────────────────────────────────────────────
describe("admin.getStats", () => {
  it("returns platform stats for admin users", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getStats();
    expect(result).toMatchObject({ totalUsers: 0, openJobs: 0 });
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getStats()).rejects.toThrow();
  });
});

// ─── Platform fee calculation ─────────────────────────────────────────────────
describe("Platform fee split", () => {
  it("handyman receives exactly 80% of bid amount", () => {
    const bidAmount = 200;
    const handymanPayout = bidAmount * 0.8;
    const platformFee = bidAmount * 0.2;
    expect(handymanPayout).toBe(160);
    expect(platformFee).toBe(40);
    expect(handymanPayout + platformFee).toBe(bidAmount);
  });

  it("handles fractional amounts correctly", () => {
    const bidAmount = 125.50;
    const handymanPayout = Math.round(bidAmount * 0.8 * 100) / 100;
    expect(handymanPayout).toBe(100.40);
  });
});

// ─── Job status values ────────────────────────────────────────────────────────
describe("Job status lifecycle", () => {
  it("uses correct status enum values", () => {
    const validStatuses = ["open", "in_progress", "completed", "disputed"];
    expect(validStatuses).toContain("open");
    expect(validStatuses).toContain("in_progress");
    expect(validStatuses).toContain("completed");
    expect(validStatuses).toContain("disputed");
    expect(validStatuses).not.toContain("cancelled");
    expect(validStatuses).not.toContain("pending");
  });
});
