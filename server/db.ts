import { and, desc, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Bid,
  Dispute,
  HandymanProfile,
  InsertBid,
  InsertDispute,
  InsertHandymanProfile,
  InsertJob,
  InsertPayment,
  InsertReview,
  InsertUser,
  Job,
  Payment,
  Review,
  User,
  bids,
  disputes,
  handymanProfiles,
  jobs,
  payments,
  reviews,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "passwordHash", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (user.userType !== undefined) {
    values.userType = user.userType;
    updateSet.userType = user.userType;
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function createLocalUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  userType: "homeowner" | "handyman";
}): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const email = normalizeEmail(input.email);
  const openId = `local:${email}`;

  await db.insert(users).values({
    openId,
    name: input.name,
    email,
    passwordHash: input.passwordHash,
    loginMethod: "email",
    userType: input.userType,
    lastSignedIn: new Date(),
  });

  const created = await getUserByOpenId(openId);
  if (!created) throw new Error("Failed to create user");
  return created;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserType(userId: number, userType: "homeowner" | "handyman") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ userType }).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Handyman Profiles ────────────────────────────────────────────────────────

export async function getHandymanProfile(userId: number): Promise<HandymanProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(handymanProfiles).where(eq(handymanProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function createHandymanProfile(data: InsertHandymanProfile): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(handymanProfiles).values(data);
}

export async function updateHandymanProfile(
  userId: number,
  data: Partial<InsertHandymanProfile>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(handymanProfiles).set(data).where(eq(handymanProfiles.userId, userId));
}

export async function getAllHandymanProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(handymanProfiles).orderBy(desc(handymanProfiles.rating));
}

export async function getHandymanProfilesForAdmin() {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(handymanProfiles)
    .orderBy(desc(handymanProfiles.createdAt));

  const enriched = await Promise.all(
    rows.map(async (profile) => {
      const user = await getUserById(profile.userId);
      return {
        ...profile,
        userName: user?.name ?? null,
        userEmail: user?.email ?? null,
      };
    })
  );

  return enriched;
}

export async function setHandymanInsuranceVerification(
  userId: number,
  insuranceVerified: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(handymanProfiles)
    .set({
      insuranceVerified,
      verified: insuranceVerified,
    })
    .where(eq(handymanProfiles.userId, userId));
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function createJob(data: InsertJob): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(jobs).values(data);
  return (result[0] as any).insertId;
}

export async function getJobById(id: number): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0];
}

export async function getJobsByHomeowner(homeownerId: number): Promise<Job[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).where(eq(jobs.homeownerId, homeownerId)).orderBy(desc(jobs.createdAt));
}

export async function getOpenJobs(limit = 20, offset = 0, category?: string): Promise<Job[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = category
    ? and(eq(jobs.status, "open"), eq(jobs.category, category))
    : eq(jobs.status, "open");
  return db.select().from(jobs).where(conditions).orderBy(desc(jobs.createdAt)).limit(limit).offset(offset);
}

export async function updateJob(
  jobId: number,
  data: Partial<Pick<InsertJob, "title" | "description" | "category" | "location" | "budgetMin" | "budgetMax">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set(data).where(eq(jobs.id, jobId));
}

export async function updateJobStatus(
  jobId: number,
  status: Job["status"],
  extra?: { selectedHandymanId?: number; selectedBidId?: number }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set({ status, ...extra }).where(eq(jobs.id, jobId));
}

export async function deleteJobById(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(jobs).where(eq(jobs.id, jobId));
}

export async function getJobsForHandyman(handymanId: number): Promise<Job[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.selectedHandymanId, handymanId))
    .orderBy(desc(jobs.createdAt));
}

// ─── Bids ─────────────────────────────────────────────────────────────────────

export async function createBid(data: InsertBid): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(bids).values(data);
  return (result[0] as any).insertId;
}

export async function getBidsForJob(jobId: number): Promise<Bid[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids).where(eq(bids.jobId, jobId)).orderBy(bids.createdAt);
}

export async function getBidsForHandyman(handymanId: number): Promise<Bid[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids).where(eq(bids.handymanId, handymanId)).orderBy(desc(bids.createdAt));
}

export async function getBidById(id: number): Promise<Bid | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
  return result[0];
}

export async function updateBidStatus(bidId: number, status: Bid["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bids).set({ status }).where(eq(bids.id, bidId));
}

export async function rejectOtherBids(jobId: number, acceptedBidId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(bids)
    .set({ status: "rejected" })
    .where(and(eq(bids.jobId, jobId), ne(bids.id, acceptedBidId)));
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createPayment(data: InsertPayment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(payments).values(data);
  return (result[0] as any).insertId;
}

export async function getPaymentByJob(jobId: number): Promise<Payment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.jobId, jobId)).limit(1);
  return result[0];
}

export async function updatePayment(
  paymentId: number,
  data: Partial<InsertPayment>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(payments).set(data).where(eq(payments.id, paymentId));
}

export async function getPaymentsByHandyman(handymanId: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(payments)
    .where(and(eq(payments.handymanId, handymanId), eq(payments.status, "completed")))
    .orderBy(desc(payments.createdAt));
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function createReview(data: InsertReview): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(reviews).values(data);
}

export async function getReviewsForUser(revieweeId: number): Promise<Review[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.revieweeId, revieweeId)).orderBy(desc(reviews.createdAt));
}

export async function getReviewForJob(jobId: number, reviewerId: number): Promise<Review | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.jobId, jobId), eq(reviews.reviewerId, reviewerId)))
    .limit(1);
  return result[0];
}

export async function recalculateHandymanRating(handymanId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const userResult = await db.select({ id: users.id }).from(users).where(eq(users.id, handymanId)).limit(1);
  if (!userResult[0]) return;

  const reviewList = await db.select().from(reviews).where(eq(reviews.revieweeId, handymanId));
  if (reviewList.length === 0) return;

  const avg = reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length;
  await db
    .update(handymanProfiles)
    .set({ rating: avg.toFixed(2) })
    .where(eq(handymanProfiles.userId, handymanId));
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export async function createDispute(data: InsertDispute): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(disputes).values(data);
  return (result[0] as any).insertId;
}

export async function getDisputeByJob(jobId: number): Promise<Dispute | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(disputes).where(eq(disputes.jobId, jobId)).limit(1);
  return result[0];
}

export async function getAllDisputes(): Promise<Dispute[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(disputes).orderBy(desc(disputes.createdAt));
}

export async function resolveDispute(
  disputeId: number,
  resolution: "resolved_release" | "resolved_refund",
  adminNotes: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(disputes)
    .set({ status: resolution, adminNotes, resolvedAt: new Date() })
    .where(eq(disputes.id, disputeId));
}