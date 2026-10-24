import "dotenv/config";

// SaskHandy reminder windows use Saskatchewan local time, regardless of server timezone.
process.env.TZ = "America/Regina";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { constructWebhookEvent } from "../stripe";
import {
  sendExpiredJobBidClosedEmail,
  sendJobArchivedAfterInactivityEmail,
  sendOpenJobBidReminderEmail,
  sendPaymentReminderEmail,
  sendStaleJobWarningEmail,
} from "../email";
import {
  archiveJobAsSystemExpired,
  createNotification,
  getAwaitingPaymentJobsForReminder,
  getBidsForJob,
  getDb,
  getJobById,
  getOpenJobsForStaleMaintenance,
  getOpenJobsWithPendingBidsForReminder,
  getUserById,
  hasJobSystemNotification,
  markBidReminderChecked,
  markBidReminderSent,
  markPaymentReminderChecked,
  markPaymentReminderSent,
  updateJob,
} from "../db";
import { payments, jobs, quotes } from "../../drizzle/schema";
import { and, eq, isNull, ne, or } from "drizzle-orm";
import { storagePut } from "../storage";
import multer from "multer";
import { nanoid } from "nanoid";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.close(() => resolve(true));
    });

    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

function getJobIdFromPaymentIntent(intent: any) {
  const rawJobId = intent?.metadata?.jobId;
  const jobId = Number.parseInt(rawJobId ?? "0", 10);

  if (!Number.isFinite(jobId) || jobId <= 0) {
    return null;
  }

  return jobId;
}

function getQuoteIdFromPaymentIntent(intent: any) {
  const rawQuoteId = intent?.metadata?.quoteId;
  const quoteId = Number.parseInt(rawQuoteId ?? "0", 10);

  if (!Number.isFinite(quoteId) || quoteId <= 0) {
    return null;
  }

  return quoteId;
}

async function updateQuoteFromPaymentIntent(
  intent: any,
  status: "paid" | "payment_failed"
) {
  const quoteId = getQuoteIdFromPaymentIntent(intent);
  if (!quoteId) return false;

  const db = await getDb();
  const rows = await db
    .select({
      totalAmount: quotes.totalAmount,
      stripePaymentIntentId: quotes.stripePaymentIntentId,
    })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1);
  const quote = rows[0];

  if (!quote) {
    console.warn(`[Webhook] Quote ${quoteId} from payment intent ${intent.id} was not found.`);
    return true;
  }
  if (quote.stripePaymentIntentId && quote.stripePaymentIntentId !== intent.id) {
    console.warn(`[Webhook] Ignored stale payment intent ${intent.id} for quote ${quoteId}.`);
    return true;
  }

  if (status === "paid") {
    const paidAmount = Number(intent.amount_received ?? intent.amount);
    const expectedAmount = Math.round(Number(quote.totalAmount) * 100);
    if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
      console.error(
        `[Webhook] Amount mismatch for quote ${quoteId}: expected ${expectedAmount}, received ${paidAmount}.`
      );
      return true;
    }
  }

  const now = new Date();
  await db
    .update(quotes)
    .set({
      stripePaymentIntentId: intent.id,
      status,
      ...(status === "paid" ? { paidAt: now } : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(quotes.id, quoteId),
        or(isNull(quotes.stripePaymentIntentId), eq(quotes.stripePaymentIntentId, intent.id)),
        ...(status === "payment_failed" ? [ne(quotes.status, "paid")] : [])
      )
    );

  console.log(`[Webhook] Quote ${quoteId} payment ${status}.`);
  return true;
}

async function markPaymentSucceeded(intent: any) {
  if (await updateQuoteFromPaymentIntent(intent, "paid")) return;

  const jobId = getJobIdFromPaymentIntent(intent);

  if (!jobId) {
    console.warn("[Webhook] payment_intent.succeeded missing valid jobId metadata:", intent.id);
    return;
  }

  const db = await getDb();

  await db
    .update(payments)
    .set({
      status: "pending",
      stripePaymentIntentId: intent.id,
      updatedAt: new Date(),
    })
    .where(eq(payments.jobId, jobId));

  await db
    .update(jobs)
    .set({
      status: "in_progress",
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  console.log(`[Webhook] Payment succeeded for job ${jobId}. Job moved to in_progress.`);
}

async function markPaymentFailed(intent: any) {
  if (await updateQuoteFromPaymentIntent(intent, "payment_failed")) return;

  const jobId = getJobIdFromPaymentIntent(intent);

  if (!jobId) {
    console.warn("[Webhook] payment_intent.payment_failed missing valid jobId metadata:", intent.id);
    return;
  }

  const db = await getDb();

  await db
    .update(payments)
    .set({
      status: "failed",
      stripePaymentIntentId: intent.id,
      updatedAt: new Date(),
    })
    .where(eq(payments.jobId, jobId));

  await db
    .update(jobs)
    .set({
      status: "awaiting_payment",
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  console.warn(
    "[Webhook] Payment failed:",
    intent.id,
    intent.last_payment_error?.message ?? "Unknown error"
  );
}

async function markPaymentCanceled(intent: any) {
  if (await updateQuoteFromPaymentIntent(intent, "payment_failed")) return;

  const jobId = getJobIdFromPaymentIntent(intent);

  if (!jobId) {
    console.warn("[Webhook] payment_intent.canceled missing valid jobId metadata:", intent.id);
    return;
  }

  const db = await getDb();

  await db
    .update(payments)
    .set({
      status: "failed",
      stripePaymentIntentId: intent.id,
      updatedAt: new Date(),
    })
    .where(eq(payments.jobId, jobId));

  await db
    .update(jobs)
    .set({
      status: "awaiting_payment",
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  console.warn("[Webhook] Payment canceled:", intent.id);
}

const BID_REMINDER_CHECK_INTERVAL_MS = 15 * 60 * 1000;
const BID_REMINDER_1_ACTIVE_HOURS = 6;
const BID_REMINDER_2_AFTER_PREVIOUS_ACTIVE_HOURS = 24;
const BID_REMINDER_3_AFTER_PREVIOUS_ACTIVE_HOURS = 48;
const PAYMENT_REMINDER_ACTIVE_HOURS = 3;
const QUIET_HOUR_START = 23;
const QUIET_HOUR_END = 6;

// Open-job marketplace hygiene. The router gives active jobs a 28-day window.
// We warn halfway through, warn again 7 days before removal, then soft-archive.
const OPEN_JOB_ACTIVE_DAYS = 28;
const STALE_JOB_WARNING_DAYS_BEFORE_EXPIRY = 14;
const STALE_JOB_FINAL_WARNING_DAYS_BEFORE_EXPIRY = 7;
const LEGACY_STALE_JOB_GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const STALE_JOB_WARNING_TITLE = "Your job needs attention";
const STALE_JOB_FINAL_WARNING_TITLE = "Your job will be removed soon";

function isQuietHour(date: Date) {
  const hour = date.getHours();
  return hour >= QUIET_HOUR_START || hour < QUIET_HOUR_END;
}

function getNextActiveStart(date: Date) {
  const next = new Date(date);

  if (next.getHours() >= QUIET_HOUR_START) {
    next.setDate(next.getDate() + 1);
    next.setHours(QUIET_HOUR_END, 0, 0, 0);
    return next;
  }

  if (next.getHours() < QUIET_HOUR_END) {
    next.setHours(QUIET_HOUR_END, 0, 0, 0);
    return next;
  }

  return next;
}

function calculateActiveHoursBetween(startDate: Date, endDate: Date) {
  if (endDate <= startDate) return 0;

  let cursor = new Date(startDate);
  let activeMs = 0;

  while (cursor < endDate) {
    if (isQuietHour(cursor)) {
      cursor = getNextActiveStart(cursor);
      continue;
    }

    const quietStart = new Date(cursor);
    quietStart.setHours(QUIET_HOUR_START, 0, 0, 0);

    const segmentEnd = quietStart < endDate ? quietStart : endDate;

    if (segmentEnd > cursor) {
      activeMs += segmentEnd.getTime() - cursor.getTime();
    }

    cursor = segmentEnd;

    if (isQuietHour(cursor)) {
      cursor = getNextActiveStart(cursor);
    }
  }

  return activeMs / (1000 * 60 * 60);
}

type BidReminderNumber = 1 | 2 | 3;

function getDueBidReminderNumber(job: any, now: Date): BidReminderNumber | null {
  if (!job.firstBidAt) return null;

  const firstReminderAt = job.bidReminder1SentAt ?? job.bidReminderSentAt ?? null;
  const secondReminderAt = job.bidReminder2SentAt ?? null;
  const thirdReminderAt = job.bidReminder3SentAt ?? null;

  if (!firstReminderAt) {
    const activeHoursSinceFirstBid = calculateActiveHoursBetween(new Date(job.firstBidAt), now);
    return activeHoursSinceFirstBid >= BID_REMINDER_1_ACTIVE_HOURS ? 1 : null;
  }

  if (!secondReminderAt) {
    const activeHoursSinceReminder1 = calculateActiveHoursBetween(new Date(firstReminderAt), now);
    return activeHoursSinceReminder1 >= BID_REMINDER_2_AFTER_PREVIOUS_ACTIVE_HOURS ? 2 : null;
  }

  if (!thirdReminderAt) {
    const activeHoursSinceReminder2 = calculateActiveHoursBetween(new Date(secondReminderAt), now);
    return activeHoursSinceReminder2 >= BID_REMINDER_3_AFTER_PREVIOUS_ACTIVE_HOURS ? 3 : null;
  }

  return null;
}

async function safeSendReminderEmail(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error: any) {
    console.error(`[ReminderEmail] ${label} failed:`, error?.message ?? error);
  }
}

let reminderInterval: NodeJS.Timeout | null = null;
let reminderCheckRunning = false;

async function checkOpenJobBidReminders(now: Date) {
  const jobsWithPendingBids = await getOpenJobsWithPendingBidsForReminder();

  for (const job of jobsWithPendingBids) {
    await markBidReminderChecked(job.id);

    const reminderNumber = getDueBidReminderNumber(job, now);
    if (!reminderNumber) continue;

    const homeowner = await getUserById(job.homeownerId);
    const pendingBidCount = job.pendingBidCount ?? job.pendingBids?.length ?? 0;

    await createNotification({
      userId: job.homeownerId,
      type: "system",
      title:
        reminderNumber === 1
          ? "You have bids waiting"
          : reminderNumber === 2
          ? "Your bids are still waiting"
          : "Final reminder to review your bids",
      message: `Your job "${job.title}" has ${pendingBidCount} bid${
        pendingBidCount === 1 ? "" : "s"
      } waiting. You can review bids, message handymen before choosing, and only move forward when you feel comfortable.`,
      link: `/jobs/${job.id}`,
      read: false,
    });

    if (homeowner?.email) {
      await safeSendReminderEmail(`open-job-bid-reminder-${reminderNumber}`, () =>
        sendOpenJobBidReminderEmail({
          to: homeowner.email!,
          homeownerName: homeowner.name,
          jobTitle: job.title,
          jobId: job.id,
          pendingBidCount,
          reminderNumber,
        })
      );
    }

    await markBidReminderSent(job.id, reminderNumber);

    console.log(
      `[BidReminder] Sent reminder ${reminderNumber} for job ${job.id} to homeowner ${
        homeowner?.email ?? job.homeownerId
      }.`
    );
  }
}

function getDaysUntil(date: Date, now: Date) {
  return (date.getTime() - now.getTime()) / DAY_MS;
}

function getStaleCycleStart(expiresAt: Date) {
  return new Date(expiresAt.getTime() - OPEN_JOB_ACTIVE_DAYS * DAY_MS);
}

function formatJobExpiryDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Regina",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function checkStaleOpenJobs(now: Date) {
  const openJobs = await getOpenJobsForStaleMaintenance();

  for (const job of openJobs) {
    // Jobs with accepted bids are already excluded by the DB query. If an old
    // row somehow has no deadline, start a fresh 28-day window rather than
    // removing it unexpectedly.
    if (!job.expiresAt) {
      const expiresAt = new Date(now.getTime() + OPEN_JOB_ACTIVE_DAYS * DAY_MS);
      await updateJob(job.id, { expiresAt });
      console.log(`[StaleJob] Added missing expiry window to job ${job.id}.`);
      continue;
    }

    const expiresAt = new Date(job.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      console.warn(`[StaleJob] Job ${job.id} has an invalid expiresAt value. Skipping.`);
      continue;
    }

    const cycleStart = getStaleCycleStart(expiresAt);
    const daysUntilExpiry = getDaysUntil(expiresAt, now);

    const firstWarningSent = await hasJobSystemNotification({
      userId: job.homeownerId,
      jobId: job.id,
      title: STALE_JOB_WARNING_TITLE,
      since: cycleStart,
    });

    const finalWarningSent = await hasJobSystemNotification({
      userId: job.homeownerId,
      jobId: job.id,
      title: STALE_JOB_FINAL_WARNING_TITLE,
      since: cycleStart,
    });

    // Existing production jobs may already have an expiresAt in the past from
    // the old 30-day field that was never enforced. Never archive those on the
    // first maintenance pass. Give the homeowner one explicit 7-day grace window.
    if (daysUntilExpiry <= 0 && !finalWarningSent) {
      const graceExpiresAt = new Date(now.getTime() + LEGACY_STALE_JOB_GRACE_DAYS * DAY_MS);
      await updateJob(job.id, { expiresAt: graceExpiresAt });

      await createNotification({
        userId: job.homeownerId,
        type: "system",
        title: STALE_JOB_FINAL_WARNING_TITLE,
        message: `Your job "${job.title}" has been open for a while. We’re cleaning up older listings, so it will be removed on ${formatJobExpiryDate(
          graceExpiresAt
        )} unless you edit the job, message a handyman, respond to a bid, or choose Keep Job Open.`,
        link: `/jobs/${job.id}`,
        read: false,
      });

      const homeowner = await getUserById(job.homeownerId);
      const pendingBidCount = (await getBidsForJob(job.id)).filter(
        (bid) => bid.status === "pending"
      ).length;

      if (homeowner?.email) {
        await safeSendReminderEmail("legacy-stale-job-final-warning", () =>
          sendStaleJobWarningEmail({
            to: homeowner.email!,
            homeownerName: homeowner.name,
            jobTitle: job.title,
            jobId: job.id,
            daysRemaining: LEGACY_STALE_JOB_GRACE_DAYS,
            pendingBidCount,
          })
        );
      }

      console.log(
        `[StaleJob] Gave legacy job ${job.id} a ${LEGACY_STALE_JOB_GRACE_DAYS}-day grace window.`
      );
      continue;
    }

    // At the real deadline, re-read the job immediately before archiving. This
    // prevents a stale in-memory copy from removing a job that the homeowner
    // just refreshed while the maintenance loop was running.
    if (daysUntilExpiry <= 0 && finalWarningSent) {
      const latestJob = await getJobById(job.id);
      if (!latestJob || latestJob.status !== "open") continue;
      if (latestJob.selectedBidId || latestJob.selectedHandymanId) continue;
      if (!latestJob.expiresAt || new Date(latestJob.expiresAt).getTime() > now.getTime()) continue;

      const pendingBids = (await getBidsForJob(job.id)).filter((bid) => bid.status === "pending");
      const archived = await archiveJobAsSystemExpired(job.id);

      if (!archived.archived) continue;

      await createNotification({
        userId: job.homeownerId,
        type: "system",
        title: "Job removed after inactivity",
        message: `Your job "${job.title}" was removed from the active marketplace after no homeowner activity. If you still need the work done, please post a new job.`,
        link: "/homeowner/dashboard",
        read: false,
      });

      const homeowner = await getUserById(job.homeownerId);
      if (homeowner?.email) {
        await safeSendReminderEmail("stale-job-archived-homeowner", () =>
          sendJobArchivedAfterInactivityEmail({
            to: homeowner.email!,
            homeownerName: homeowner.name,
            jobTitle: job.title,
          })
        );
      }

      const notifiedHandymen = new Set<number>();
      for (const bid of pendingBids) {
        if (notifiedHandymen.has(bid.handymanId)) continue;
        notifiedHandymen.add(bid.handymanId);

        await createNotification({
          userId: bid.handymanId,
          type: "system",
          title: "Job no longer available",
          message: `The job "${job.title}" was removed because the homeowner did not keep the listing active. Your bid was closed, not rejected.`,
          link: "/handyman/dashboard",
          read: false,
        });

        const handyman = await getUserById(bid.handymanId);
        if (handyman?.email) {
          await safeSendReminderEmail("expired-job-bid-closed", () =>
            sendExpiredJobBidClosedEmail({
              to: handyman.email!,
              handymanName: handyman.name,
              jobTitle: job.title,
            })
          );
        }
      }

      console.log(
        `[StaleJob] Archived job ${job.id} after inactivity and closed ${pendingBids.length} pending bid(s).`
      );
      continue;
    }

    if (
      daysUntilExpiry <= STALE_JOB_FINAL_WARNING_DAYS_BEFORE_EXPIRY &&
      !finalWarningSent
    ) {
      await createNotification({
        userId: job.homeownerId,
        type: "system",
        title: STALE_JOB_FINAL_WARNING_TITLE,
        message: `Your job "${job.title}" will be removed on ${formatJobExpiryDate(
          expiresAt
        )} unless you edit the job, message a handyman, respond to a bid, or choose Keep Job Open.`,
        link: `/jobs/${job.id}`,
        read: false,
      });

      const homeowner = await getUserById(job.homeownerId);
      const pendingBidCount = (await getBidsForJob(job.id)).filter(
        (bid) => bid.status === "pending"
      ).length;

      if (homeowner?.email) {
        await safeSendReminderEmail("stale-job-final-warning", () =>
          sendStaleJobWarningEmail({
            to: homeowner.email!,
            homeownerName: homeowner.name,
            jobTitle: job.title,
            jobId: job.id,
            daysRemaining: Math.max(1, Math.ceil(daysUntilExpiry)),
            pendingBidCount,
          })
        );
      }

      console.log(`[StaleJob] Sent final warning for job ${job.id}.`);
      continue;
    }

    if (
      daysUntilExpiry <= STALE_JOB_WARNING_DAYS_BEFORE_EXPIRY &&
      !firstWarningSent
    ) {
      const bidCount = (await getBidsForJob(job.id)).filter((bid) => bid.status === "pending").length;
      const bidText =
        bidCount > 0
          ? ` You currently have ${bidCount} pending bid${bidCount === 1 ? "" : "s"} to review.`
          : "";

      await createNotification({
        userId: job.homeownerId,
        type: "system",
        title: STALE_JOB_WARNING_TITLE,
        message: `Your job "${job.title}" is still open.${bidText} If you still need help, take action before ${formatJobExpiryDate(
          expiresAt
        )} so the listing stays active.`,
        link: `/jobs/${job.id}`,
        read: false,
      });

      const homeowner = await getUserById(job.homeownerId);
      if (homeowner?.email) {
        await safeSendReminderEmail("stale-job-warning", () =>
          sendStaleJobWarningEmail({
            to: homeowner.email!,
            homeownerName: homeowner.name,
            jobTitle: job.title,
            jobId: job.id,
            daysRemaining: Math.max(1, Math.ceil(daysUntilExpiry)),
            pendingBidCount: bidCount,
          })
        );
      }

      console.log(`[StaleJob] Sent inactivity warning for job ${job.id}.`);
    }
  }
}

async function checkPaymentReminders(now: Date) {
  const awaitingPaymentJobs = await getAwaitingPaymentJobsForReminder();

  for (const job of awaitingPaymentJobs) {
    await markPaymentReminderChecked(job.id);

    if (!job.acceptedAt) continue;

    const activeHoursSinceAcceptance = calculateActiveHoursBetween(new Date(job.acceptedAt), now);

    if (activeHoursSinceAcceptance < PAYMENT_REMINDER_ACTIVE_HOURS) {
      continue;
    }

    const homeowner = await getUserById(job.homeownerId);
    const handyman = job.selectedHandymanId ? await getUserById(job.selectedHandymanId) : null;
    const bidAmount = job.acceptedBid?.bidAmount ?? job.payment?.amount ?? null;

    await createNotification({
      userId: job.homeownerId,
      type: "system",
      title: "Complete payment to start your job",
      message: `You accepted a bid for "${job.title}". Complete secure payment through SaskHandy so the job can move forward. Payment is held securely until you mark the job complete.`,
      link: `/jobs/${job.id}`,
      read: false,
    });

    if (homeowner?.email) {
      await safeSendReminderEmail("payment-reminder", () =>
        sendPaymentReminderEmail({
          to: homeowner.email!,
          homeownerName: homeowner.name,
          jobTitle: job.title,
          handymanName: handyman?.name,
          bidAmount,
          jobId: job.id,
        })
      );
    }

    await markPaymentReminderSent(job.id);

    console.log(
      `[PaymentReminder] Sent payment reminder for job ${job.id} to homeowner ${
        homeowner?.email ?? job.homeownerId
      } after ${activeHoursSinceAcceptance.toFixed(1)} active hours.`
    );
  }
}

async function checkJobReminders() {
  if (reminderCheckRunning) return;

  reminderCheckRunning = true;

  try {
    const now = new Date();

    if (isQuietHour(now)) {
      console.log("[Reminder] Skipping check during quiet hours.");
      return;
    }

    await checkOpenJobBidReminders(now);
    await checkPaymentReminders(now);
    await checkStaleOpenJobs(now);
  } catch (err: any) {
    console.error("[Reminder] Check failed:", err?.message ?? err);
  } finally {
    reminderCheckRunning = false;
  }
}

function startReminderLoop() {
  if (reminderInterval) return;

  // Run once shortly after startup, then every 15 minutes.
  setTimeout(() => {
    void checkJobReminders();
  }, 60 * 1000);

  reminderInterval = setInterval(() => {
    void checkJobReminders();
  }, BID_REMINDER_CHECK_INTERVAL_MS);

  console.log("[Reminder] Reminder loop started.");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];

      if (!signature || Array.isArray(signature)) {
        console.error("[Webhook] Missing or invalid Stripe signature header");
        return res.status(400).send("Webhook Error: Missing or invalid Stripe signature");
      }

      let event;

      try {
        event = constructWebhookEvent(req.body as Buffer, signature);
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        switch (event.type) {
          case "payment_intent.succeeded": {
            const intent = event.data.object as any;
            await markPaymentSucceeded(intent);
            break;
          }

          case "payment_intent.payment_failed": {
            const intent = event.data.object as any;
            await markPaymentFailed(intent);
            break;
          }

          case "payment_intent.canceled": {
            const intent = event.data.object as any;
            await markPaymentCanceled(intent);
            break;
          }

          default:
            console.log(`[Webhook] Ignored event type: ${event.type}`);
            break;
        }

        return res.json({ received: true });
      } catch (err: any) {
        console.error("[Webhook] Handler failed:", err?.message ?? err);
        return res.status(500).json({
          error: "Webhook handler failed",
          message: err?.message ?? "Unknown error",
        });
      }
    }
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const ext = (req.file.originalname as string).split(".").pop() ?? "bin";
      const key = `uploads/${nanoid()}.${ext}`;

      const { url } = await storagePut(
        key,
        req.file.buffer as Buffer,
        req.file.mimetype as string
      );

      return res.json({ url, key });
    } catch (err: any) {
      console.error("[Upload] Error:", err.message);
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startReminderLoop();
  });
}

startServer().catch(console.error);
