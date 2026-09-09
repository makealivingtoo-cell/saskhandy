import { eq, sql } from "drizzle-orm";
import {
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import { getDb } from "./db";

const jobWorkReviews = mysqlTable("job_work_reviews", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  handymanId: int("handymanId").notNull(),
  status: mysqlEnum("status", ["ready", "changes_requested"])
    .default("ready")
    .notNull(),
  readyAt: timestamp("readyAt"),
  changesRequestedAt: timestamp("changesRequestedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobWorkReview = typeof jobWorkReviews.$inferSelect;

let tableReadyPromise: Promise<void> | null = null;

/**
 * Pack #6 retry deliberately stores review state in its own table.
 *
 * This keeps the existing jobs table and every existing jobs query untouched.
 * If this feature table ever has a problem, the homeowner dashboard, admin
 * counts, bidding, payments and existing job records still load normally.
 */
async function ensureJobWorkReviewsTable() {
  if (!tableReadyPromise) {
    tableReadyPromise = (async () => {
      const db = await getDb();

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS job_work_reviews (
          id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
          jobId int NOT NULL,
          handymanId int NOT NULL,
          status enum('ready','changes_requested') NOT NULL DEFAULT 'ready',
          readyAt timestamp NULL,
          changesRequestedAt timestamp NULL,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY job_work_reviews_jobId_unique (jobId)
        )
      `);
    })().catch((error) => {
      // Allow a later request to retry if the first table check failed.
      tableReadyPromise = null;
      throw error;
    });
  }

  return tableReadyPromise;
}

export async function getJobWorkReview(
  jobId: number,
): Promise<JobWorkReview | null> {
  await ensureJobWorkReviewsTable();
  const db = await getDb();

  const rows = await db
    .select()
    .from(jobWorkReviews)
    .where(eq(jobWorkReviews.jobId, jobId))
    .limit(1);

  return rows[0] ?? null;
}

export async function markJobWorkReady(params: {
  jobId: number;
  handymanId: number;
}): Promise<JobWorkReview> {
  await ensureJobWorkReviewsTable();
  const db = await getDb();
  const now = new Date();
  const existing = await getJobWorkReview(params.jobId);

  if (existing) {
    await db
      .update(jobWorkReviews)
      .set({
        handymanId: params.handymanId,
        status: "ready",
        readyAt: now,
        changesRequestedAt: null,
        updatedAt: now,
      })
      .where(eq(jobWorkReviews.jobId, params.jobId));
  } else {
    await db.insert(jobWorkReviews).values({
      jobId: params.jobId,
      handymanId: params.handymanId,
      status: "ready",
      readyAt: now,
      changesRequestedAt: null,
    });
  }

  const updated = await getJobWorkReview(params.jobId);

  if (!updated) {
    throw new Error("Unable to save work review state");
  }

  return updated;
}

export async function markJobChangesRequested(
  jobId: number,
): Promise<JobWorkReview> {
  await ensureJobWorkReviewsTable();
  const db = await getDb();
  const existing = await getJobWorkReview(jobId);

  if (!existing) {
    throw new Error("Work review state not found");
  }

  const now = new Date();

  await db
    .update(jobWorkReviews)
    .set({
      status: "changes_requested",
      changesRequestedAt: now,
      updatedAt: now,
    })
    .where(eq(jobWorkReviews.jobId, jobId));

  const updated = await getJobWorkReview(jobId);

  if (!updated) {
    throw new Error("Unable to update work review state");
  }

  return updated;
}
