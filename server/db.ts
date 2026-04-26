import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import {
  bids,
  disputes,
  emailVerificationTokens,
  handymanProfiles,
  jobs,
  messages,
  notifications,
  passwordResetTokens,
  payments,
  payoutRequests,
  reviews,
  supportTicketMessages,
  supportTickets,
  users,
  type InsertBid,
  type InsertDispute,
  type InsertEmailVerificationToken,
  type InsertHandymanProfile,
  type InsertJob,
  type InsertNotification,
  type InsertPasswordResetToken,
  type InsertPayment,
  type InsertPayoutRequest,
  type InsertReview,
  type InsertUser,
} from "../drizzle/schema";

let dbInstance: Awaited<ReturnType<typeof createDb>> | null = null;

async function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const connection = await mysql.createConnection(databaseUrl);
  return drizzle(connection);
}

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await createDb();
  }
  return dbInstance;
}

function stringifyPhotos(photos?: string[] | null) {
  if (!photos || photos.length === 0) return null;
  return JSON.stringify(photos);
}

function parsePhotos(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function normalizeJob<T extends { photos?: string | null }>(job: T) {
  return {
    ...job,
    photos: parsePhotos(job.photos),
  };
}

/**
 * Keep auth lookups minimal.
 * Do NOT include optional legal/marketing fields here.
 * This reduces the chance of auth breaking if production schema drifts.
 */
const authUserSelect = {
  id: users.id,
  openId: users.openId,
  name: users.name,
  email: users.email,
  passwordHash: users.passwordHash,
  loginMethod: users.loginMethod,
  role: users.role,
  userType: users.userType,
  emailVerified: users.emailVerified,
  emailVerifiedAt: users.emailVerifiedAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  lastSignedIn: users.lastSignedIn,
};

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getUserById(id: number) {
  const db = await getDb();
  const rows = await db
    .select(authUserSelect)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const rows = await db
    .select(authUserSelect)
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const rows = await db
    .select(authUserSelect)
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllUsers() {
  const db = await getDb();
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function deleteUserById(userId: number) {
  const db = await getDb();
  await db.delete(users).where(eq(users.id, userId));
}

export async function upsertUser(data: Partial<InsertUser> & Pick<InsertUser, "openId">) {
  const db = await getDb();
  const existing = await getUserByOpenId(data.openId);

  if (existing) {
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      })
      .where(eq(users.openId, data.openId));

    return (await getUserByOpenId(data.openId))!;
  }

  await db.insert(users).values({
    ...data,
    lastSignedIn: new Date(),
  });

  return (await getUserByOpenId(data.openId))!;
}

export async function createLocalUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  userType: "homeowner" | "handyman";
  termsVersionAccepted: string;
  privacyVersionAccepted: string;
  termsAcceptedAt: Date;
  privacyAcceptedAt: Date;
  ageConfirmedAt: Date;
  marketingOptIn: boolean;
  marketingOptInAt?: Date | null;
}) {
  const db = await getDb();
  const openId = `local_${crypto.randomUUID()}`;

  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "local",
    role: "user",
    userType: data.userType,
    emailVerified: false,
    emailVerifiedAt: null,
    termsVersionAccepted: data.termsVersionAccepted,
    privacyVersionAccepted: data.privacyVersionAccepted,
    termsAcceptedAt: data.termsAcceptedAt,
    privacyAcceptedAt: data.privacyAcceptedAt,
    ageConfirmedAt: data.ageConfirmedAt,
    marketingOptIn: data.marketingOptIn,
    marketingOptInAt: data.marketingOptInAt ?? null,
    lastSignedIn: new Date(),
  });

  return (await getUserByOpenId(openId))!;
}

export async function markUserEmailVerified(userId: number) {
  const db = await getDb();
  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function updateUserType(userId: number, userType: "homeowner" | "handyman") {
  const db = await getDb();
  await db.update(users).set({ userType }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// ─── Email Verification Tokens ────────────────────────────────────────────────
export async function createEmailVerificationToken(data: InsertEmailVerificationToken) {
  const db = await getDb();
  const result = await db.insert(emailVerificationTokens).values(data);
  return Number((result as any).insertId);
}

export async function getValidEmailVerificationToken(token: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function deleteEmailVerificationTokensForUser(userId: number) {
  const db = await getDb();
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
}

export async function deleteEmailVerificationTokenById(id: number) {
  const db = await getDb();
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id));
}

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export async function createPasswordResetToken(data: InsertPasswordResetToken) {
  const db = await getDb();
  const result = await db.insert(passwordResetTokens).values(data);
  return Number((result as any).insertId);
}

export async function deletePasswordResetTokensForUser(userId: number) {
  const db = await getDb();
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
}

export async function getValidPasswordResetToken(token: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function markPasswordResetTokenUsed(id: number) {
  const db = await getDb();
  await db
    .update(passwordResetTokens)
    .set({
      usedAt: new Date(),
    })
    .where(eq(passwordResetTokens.id, id));
}

// ─── Handyman Profiles ────────────────────────────────────────────────────────
export async function getHandymanProfile(userId: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(handymanProfiles)
    .where(eq(handymanProfiles.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getAllHandymanProfiles() {
  const db = await getDb();
  return db.select().from(handymanProfiles).orderBy(desc(handymanProfiles.createdAt));
}

export async function createHandymanProfile(data: InsertHandymanProfile) {
  const db = await getDb();
  await db.insert(handymanProfiles).values(data);
  return getHandymanProfile(data.userId);
}

export async function updateHandymanProfile(userId: number, data: Partial<InsertHandymanProfile>) {
  const db = await getDb();
  await db
    .update(handymanProfiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(handymanProfiles.userId, userId));

  return getHandymanProfile(userId);
}

export async function updateHandymanStripeAccount(
  userId: number,
  data: {
    stripeAccountId?: string | null;
    stripeChargesEnabled?: boolean;
    stripePayoutsEnabled?: boolean;
    stripeDetailsSubmitted?: boolean;
  }
) {
  const db = await getDb();

  await db
    .update(handymanProfiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(handymanProfiles.userId, userId));

  return getHandymanProfile(userId);
}

export async function getHandymanProfilesForAdmin() {
  const db = await getDb();

  const rows = await db
    .select({
      id: handymanProfiles.id,
      userId: handymanProfiles.userId,
      bio: handymanProfiles.bio,
      categories: handymanProfiles.categories,
      hourlyRate: handymanProfiles.hourlyRate,
      rating: handymanProfiles.rating,
      totalJobs: handymanProfiles.totalJobs,
      totalEarnings: handymanProfiles.totalEarnings,
      verified: handymanProfiles.verified,
      backgroundCheckPassed: handymanProfiles.backgroundCheckPassed,
      insuranceVerified: handymanProfiles.insuranceVerified,
      insuranceCertUrl: handymanProfiles.insuranceCertUrl,
      stripeAccountId: handymanProfiles.stripeAccountId,
      stripeChargesEnabled: handymanProfiles.stripeChargesEnabled,
      stripePayoutsEnabled: handymanProfiles.stripePayoutsEnabled,
      stripeDetailsSubmitted: handymanProfiles.stripeDetailsSubmitted,
      createdAt: handymanProfiles.createdAt,
      updatedAt: handymanProfiles.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(handymanProfiles)
    .leftJoin(users, eq(handymanProfiles.userId, users.id))
    .orderBy(desc(handymanProfiles.updatedAt));

  return rows;
}

export async function setHandymanInsuranceVerification(userId: number, insuranceVerified: boolean) {
  const db = await getDb();
  await db
    .update(handymanProfiles)
    .set({
      insuranceVerified,
      updatedAt: new Date(),
    })
    .where(eq(handymanProfiles.userId, userId));
}

export async function recalculateHandymanRating(userId: number) {
  const db = await getDb();

  const rows = await db
    .select({
      avgRating: sql<string>`ROUND(AVG(${reviews.rating}), 2)`,
    })
    .from(reviews)
    .where(eq(reviews.revieweeId, userId));

  const avgRating = rows[0]?.avgRating ?? "0.00";

  await db
    .update(handymanProfiles)
    .set({
      rating: avgRating,
      updatedAt: new Date(),
    })
    .where(eq(handymanProfiles.userId, userId));
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export async function createJob(
  data: Omit<InsertJob, "photos"> & { photos?: string[] | null }
) {
  const db = await getDb();
  const result = await db.insert(jobs).values({
    ...data,
    photos: stringifyPhotos(data.photos),
  });
  return Number((result as any).insertId);
}

export async function getJobById(id: number) {
  const db = await getDb();
  const rows = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return rows[0] ? normalizeJob(rows[0]) : null;
}

export async function getJobsByHomeowner(homeownerId: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.homeownerId, homeownerId))
    .orderBy(desc(jobs.updatedAt));

  return rows.map(normalizeJob);
}

export async function getOpenJobs(limit = 20, offset = 0, category?: string) {
  const db = await getDb();

  if (category) {
    const rows = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.status, "open"), eq(jobs.category, category)))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map(normalizeJob);
  }

  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "open"))
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(normalizeJob);
}

export async function getJobsForHandyman(handymanId: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.selectedHandymanId, handymanId))
    .orderBy(desc(jobs.updatedAt));

  return rows.map(normalizeJob);
}

export async function getAllJobsForAdmin() {
  const db = await getDb();

  const rows = await db
    .select({
      id: jobs.id,
      homeownerId: jobs.homeownerId,
      title: jobs.title,
      description: jobs.description,
      category: jobs.category,
      location: jobs.location,
      photos: jobs.photos,
      budgetMin: jobs.budgetMin,
      budgetMax: jobs.budgetMax,
      status: jobs.status,
      selectedHandymanId: jobs.selectedHandymanId,
      selectedBidId: jobs.selectedBidId,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      expiresAt: jobs.expiresAt,
      homeownerName: users.name,
      homeownerEmail: users.email,
    })
    .from(jobs)
    .leftJoin(users, eq(jobs.homeownerId, users.id))
    .orderBy(desc(jobs.updatedAt));

  return rows.map((row) => ({
    ...row,
    photos: parsePhotos(row.photos),
  }));
}

export async function updateJob(
  id: number,
  data: Partial<Omit<InsertJob, "photos">> & { photos?: string[] | null }
) {
  const db = await getDb();
  const updateData: any = {
    ...data,
    updatedAt: new Date(),
  };

  if ("photos" in data) {
    updateData.photos = stringifyPhotos(data.photos);
  }

  await db.update(jobs).set(updateData).where(eq(jobs.id, id));
}

export async function updateJobStatus(
  jobId: number,
  status: "open" | "awaiting_payment" | "in_progress" | "completed" | "disputed" | "cancelled",
  extra?: Partial<Omit<InsertJob, "photos">> & { photos?: string[] | null }
) {
  const db = await getDb();
  const updateData: any = {
    status,
    ...(extra ?? {}),
    updatedAt: new Date(),
  };

  if (extra && "photos" in extra) {
    updateData.photos = stringifyPhotos(extra.photos);
  }

  await db.update(jobs).set(updateData).where(eq(jobs.id, jobId));
}

export async function deleteJobById(jobId: number) {
  const db = await getDb();
  await db.delete(jobs).where(eq(jobs.id, jobId));
}

export async function adminDeleteJobById(jobId: number) {
  const db = await getDb();

  const relatedSupportTickets = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(eq(supportTickets.jobId, jobId));

  const supportTicketIds = relatedSupportTickets.map((ticket) => ticket.id);

  if (supportTicketIds.length > 0) {
    await db
      .delete(supportTicketMessages)
      .where(inArray(supportTicketMessages.ticketId, supportTicketIds));
  }

  await db.delete(supportTickets).where(eq(supportTickets.jobId, jobId));
  await db.delete(messages).where(eq(messages.jobId, jobId));
  await db.delete(bids).where(eq(bids.jobId, jobId));
  await db.delete(reviews).where(eq(reviews.jobId, jobId));
  await db.delete(disputes).where(eq(disputes.jobId, jobId));
  await db.delete(payments).where(eq(payments.jobId, jobId));
  await db.delete(notifications).where(eq(notifications.link, `/jobs/${jobId}`));
  await db.delete(jobs).where(eq(jobs.id, jobId));
}

// ─── Bids ─────────────────────────────────────────────────────────────────────
export async function createBid(data: InsertBid) {
  const db = await getDb();
  const result = await db.insert(bids).values(data);
  return Number((result as any).insertId);
}

export async function getBidById(id: number) {
  const db = await getDb();
  const rows = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getBidsForJob(jobId: number) {
  const db = await getDb();
  return db.select().from(bids).where(eq(bids.jobId, jobId)).orderBy(desc(bids.createdAt));
}

export async function getBidsForHandyman(handymanId: number) {
  const db = await getDb();
  return db
    .select()
    .from(bids)
    .where(eq(bids.handymanId, handymanId))
    .orderBy(desc(bids.createdAt));
}

export async function updateBidStatus(
  bidId: number,
  status: "pending" | "accepted" | "rejected" | "cancelled"
) {
  const db = await getDb();
  await db
    .update(bids)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(bids.id, bidId));
}

export async function rejectOtherBids(jobId: number, acceptedBidId: number) {
  const db = await getDb();
  const otherBids = await db.select().from(bids).where(eq(bids.jobId, jobId));
  const rejectIds = otherBids.filter((b) => b.id !== acceptedBidId).map((b) => b.id);

  if (rejectIds.length > 0) {
    await db
      .update(bids)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(inArray(bids.id, rejectIds));
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  const result = await db.insert(payments).values(data);
  return Number((result as any).insertId);
}

export async function getPaymentByJob(jobId: number) {
  const db = await getDb();
  const rows = await db.select().from(payments).where(eq(payments.jobId, jobId)).limit(1);
  return rows[0] ?? null;
}

export async function getPaymentsByHandyman(handymanId: number) {
  const db = await getDb();
  return db
    .select()
    .from(payments)
    .where(eq(payments.handymanId, handymanId))
    .orderBy(desc(payments.createdAt));
}

export async function updatePayment(paymentId: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  await db
    .update(payments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));
}

export async function updatePaymentByJob(jobId: number, data: Partial<InsertPayment>) {
  const db = await getDb();

  await db
    .update(payments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(payments.jobId, jobId));
}

// ─── Payout Requests ──────────────────────────────────────────────────────────
export async function createPayoutRequest(data: InsertPayoutRequest) {
  const db = await getDb();
  const result = await db.insert(payoutRequests).values(data);
  return Number((result as any).insertId);
}

export async function getPayoutRequestById(id: number) {
  const db = await getDb();
  const rows = await db.select().from(payoutRequests).where(eq(payoutRequests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getPayoutRequestsByHandyman(handymanId: number) {
  const db = await getDb();
  return db
    .select()
    .from(payoutRequests)
    .where(eq(payoutRequests.handymanId, handymanId))
    .orderBy(desc(payoutRequests.createdAt));
}

export async function getAllPayoutRequests() {
  const db = await getDb();
  return db.select().from(payoutRequests).orderBy(desc(payoutRequests.createdAt));
}

export async function updatePayoutRequest(
  payoutRequestId: number,
  data: Partial<InsertPayoutRequest>
) {
  const db = await getDb();
  await db
    .update(payoutRequests)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(payoutRequests.id, payoutRequestId));
}

export async function getHandymanPayoutSummary(handymanId: number) {
  const completedPayments = await getPaymentsByHandyman(handymanId);
  const requests = await getPayoutRequestsByHandyman(handymanId);

  const completedEarnings = completedPayments.reduce((sum, payment) => {
    if (payment.status !== "completed") return sum;
    return sum + parseFloat(payment.handymanPayout);
  }, 0);

  const pendingPayouts = requests.reduce((sum, request) => {
    if (request.status !== "pending") return sum;
    return sum + parseFloat(request.amount);
  }, 0);

  const paidPayouts = requests.reduce((sum, request) => {
    if (request.status !== "paid") return sum;
    return sum + parseFloat(request.amount);
  }, 0);

  const availableBalance = Math.max(completedEarnings - pendingPayouts - paidPayouts, 0);

  return {
    completedEarnings: completedEarnings.toFixed(2),
    pendingPayouts: pendingPayouts.toFixed(2),
    paidPayouts: paidPayouts.toFixed(2),
    availableBalance: availableBalance.toFixed(2),
    payoutRequests: requests,
    completedPayments,
  };
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  const result = await db.insert(notifications).values(data);
  return Number((result as any).insertId);
}

export async function getNotificationsForUser(userId: number, limit = 20) {
  const db = await getDb();

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();

  const rows = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  return Number(rows[0]?.count ?? 0);
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();

  await db
    .update(notifications)
    .set({
      read: true,
      updatedAt: new Date(),
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();

  await db
    .update(notifications)
    .set({
      read: true,
      updatedAt: new Date(),
    })
    .where(eq(notifications.userId, userId));
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function createReview(data: InsertReview) {
  const db = await getDb();
  const result = await db.insert(reviews).values(data);
  return Number((result as any).insertId);
}

export async function getReviewsForUser(userId: number) {
  const db = await getDb();
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.revieweeId, userId))
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewForJob(jobId: number, reviewerId: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.jobId, jobId), eq(reviews.reviewerId, reviewerId)))
    .limit(1);

  return rows[0] ?? null;
}

// ─── Disputes ─────────────────────────────────────────────────────────────────
export async function createDispute(data: InsertDispute) {
  const db = await getDb();
  const result = await db.insert(disputes).values(data);
  return Number((result as any).insertId);
}

export async function getDisputeByJob(jobId: number) {
  const db = await getDb();
  const rows = await db.select().from(disputes).where(eq(disputes.jobId, jobId)).limit(1);
  return rows[0] ?? null;
}

export async function getAllDisputes() {
  const db = await getDb();
  return db.select().from(disputes).orderBy(desc(disputes.updatedAt));
}

export async function resolveDispute(
  disputeId: number,
  status: "resolved_release" | "resolved_refund",
  adminNotes: string
) {
  const db = await getDb();
  await db
    .update(disputes)
    .set({
      status,
      adminNotes,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(disputes.id, disputeId));
}

export { supportTickets, supportTicketMessages };