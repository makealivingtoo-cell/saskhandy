import { TRPCError } from "@trpc/server";
import { stripeRouter } from "./stripeRouter";
import { stripe } from "./stripe";
import {
  createMessage,
  getMessagesForJob,
  markMessageAsRead,
  getUnreadCount,
} from "./db-messages";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNewBidEmail,
  sendBidAcceptedEmail,
  sendPaymentReceivedEmail,
  sendNewMessageEmail,
  sendJobCompletedEmail,
  sendPayoutPaidEmail,
  sendPayoutRejectedEmail,
  sendDisputeOpenedEmail,
  sendDisputeResolvedEmail,
  sendNewJobPostedEmail,
} from "./email";
import { syncUserToBrevo } from "./brevo";
import { z } from "zod";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import {
  adminDeleteJobById,
  createBid,
  createDispute,
  createEmailVerificationToken,
  createHandymanProfile,
  createJob,
  createLocalUser,
  createNotification,
  createPasswordResetToken,
  createPayment,
  createPayoutRequest,
  createReview,
  deleteEmailVerificationTokenById,
  deleteEmailVerificationTokensForUser,
  deleteJobById,
  deletePasswordResetTokensForUser,
  deleteUserById,
  getAllDisputes,
  getAllHandymanProfiles,
  getAllJobsForAdmin,
  getAllPayoutRequests,
  getAllUsers,
  getBidById,
  getBidsForHandyman,
  getBidsForJob,
  getDisputeByJob,
  getHandymanPayoutSummary,
  getHandymanProfile,
  getHandymanProfilesForAdmin,
  getJobById,
  getJobsByHomeowner,
  getJobsForHandyman,
  getNotificationsForUser,
  getOpenJobs,
  getPaymentByJob,
  getPayoutRequestById,
  getPayoutRequestsByHandyman,
  getReviewForJob,
  getReviewsForUser,
  getUnreadNotificationCount,
  getUserByEmail,
  getUserById,
  getValidEmailVerificationToken,
  getValidPasswordResetToken,
  markAllNotificationsRead,
  markNotificationRead,
  markPasswordResetTokenUsed,
  markUserEmailVerified,
  recalculateHandymanRating,
  rejectOtherBids,
  resolveDispute,
  setHandymanInsuranceVerification,
  updateBidStatus,
  updateHandymanProfile,
  updateJob,
  updateJobStatus,
  updatePayment,
  updatePayoutRequest,
  updateUserPassword,
  updateUserType,
  upsertUser,
} from "./db";
import {
  addSupportTicketMessage,
  createSupportTicket,
  getAllSupportTickets,
  getSupportTicketById,
  getSupportTicketMessages,
  getSupportTicketsForUser,
  updateSupportTicketStatus,
} from "./db-support";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";

const JOB_CATEGORIES = [
  "General Helper",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "HVAC",
  "Landscaping",
  "Cleaning",
  "Drywall",
  "Roofing",
] as const;

const TERMS_VERSION = "2026-04-11";
const PRIVACY_VERSION = "2026-04-11";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = scryptSync(password, salt, 64);
  const hashBuffer = Buffer.from(hash, "hex");

  if (derived.length !== hashBuffer.length) return false;

  return timingSafeEqual(derived, hashBuffer);
}

async function safeSendEmail(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error: any) {
    console.error(`[Email] ${label} failed:`, error?.message ?? error);
  }
}

async function safeSyncBrevo(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error: any) {
    console.error(`[Brevo] ${label} failed:`, error?.message ?? error);
  }
}

async function createAndSendVerification(user: {
  id: number;
  email: string | null;
  name: string | null;
}) {
  if (!user.email) {
    throw new Error("User email is missing");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await deleteEmailVerificationTokensForUser(user.id);

  await createEmailVerificationToken({
    userId: user.id,
    email: user.email,
    token,
    expiresAt,
  });

  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token,
    });

    console.log("Verification email sent successfully to:", user.email);

    return {
      emailSent: true,
      token,
    };
  } catch (error: any) {
    console.error("Verification email failed.");
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error command:", error?.command);
    console.error("Error response:", error?.response);
    console.error("Full error object:", error);

    return {
      emailSent: false,
      token,
    };
  }
}

async function createAndSendPasswordReset(user: {
  id: number;
  email: string | null;
  name: string | null;
}) {
  if (!user.email) {
    return { emailSent: false };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await deletePasswordResetTokensForUser(user.id);

  await createPasswordResetToken({
    userId: user.id,
    email: user.email,
    token,
    expiresAt,
    usedAt: null,
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
    });

    return { emailSent: true };
  } catch (error: any) {
    console.error("Password reset email failed.");
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error command:", error?.command);
    console.error("Error response:", error?.response);
    console.error("Full error object:", error);

    return { emailSent: false };
  }
}

async function notifyUser(params: {
  userId: number;
  type:
    | "new_bid"
    | "bid_accepted"
    | "new_message"
    | "payment_received"
    | "job_completed"
    | "dispute_opened"
    | "dispute_resolved"
    | "payout_requested"
    | "payout_paid"
    | "payout_rejected"
    | "system";
  title: string;
  message: string;
  link?: string;
}) {
  await createNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    read: false,
  });
}

async function releasePaymentToHandyman(params: {
  jobId: number;
  handymanId: number;
}) {
  const payment = await getPaymentByJob(params.jobId);

  if (!payment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Payment record not found.",
    });
  }

  if (payment.status !== "pending") {
    return { released: false, reason: "Payment is not pending." };
  }

  await updatePayment(payment.id, {
    status: "completed",
    stripeTransferStatus: "not_started",
  } as any);

  const profile = await getHandymanProfile(params.handymanId);

  if (profile) {
    const newEarnings = (
      parseFloat(profile.totalEarnings ?? "0") + parseFloat(payment.handymanPayout)
    ).toFixed(2);

    await updateHandymanProfile(params.handymanId, {
      totalJobs: (profile.totalJobs ?? 0) + 1,
      totalEarnings: newEarnings,
    });
  }

  return { released: true };
}

const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  signUp: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(120),
        email: z.string().email(),
        password: z.string().min(6).max(100),
        userType: z.enum(["homeowner", "handyman"]),
        agreeTerms: z.literal(true),
        agreePrivacy: z.literal(true),
        confirmAge: z.literal(true),
        marketingOptIn: z.boolean().default(false),
        termsVersion: z.string().min(1),
        privacyVersion: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);
      const existing = await getUserByEmail(email);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const now = new Date();

      const user = await createLocalUser({
        name: input.name,
        email,
        passwordHash: hashPassword(input.password),
        userType: input.userType,
        termsVersionAccepted: input.termsVersion || TERMS_VERSION,
        privacyVersionAccepted: input.privacyVersion || PRIVACY_VERSION,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        ageConfirmedAt: now,
        marketingOptIn: input.marketingOptIn,
        marketingOptInAt: input.marketingOptIn ? now : null,
      });

      if (input.userType === "handyman") {
        await createHandymanProfile({
          userId: user.id,
          categories: "[]",
        });
      }

      if (user.email) {
        await safeSyncBrevo("signUp", () =>
          syncUserToBrevo({
            email: user.email,
            name: user.name,
            userType: input.userType,
            marketingOptIn: input.marketingOptIn,
          })
        );
      }

      const verificationResult = await createAndSendVerification(user);

      return {
        success: true,
        user,
        verificationRequired: true,
        emailSent: verificationResult.emailSent,
      };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(10) }))
    .mutation(async ({ input }) => {
      const verification = await getValidEmailVerificationToken(input.token);

      if (!verification) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This verification link is invalid or expired.",
        });
      }

      await markUserEmailVerified(verification.userId);
      await deleteEmailVerificationTokenById(verification.id);
      await deleteEmailVerificationTokensForUser(verification.userId);

      return { success: true };
    }),

  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);
      const user = await getUserByEmail(email);

      if (!user) {
        return { success: true, emailSent: false };
      }

      if (user.emailVerified) {
        return { success: true, emailSent: false };
      }

      const verificationResult = await createAndSendVerification(user);

      return {
        success: true,
        emailSent: verificationResult.emailSent,
      };
    }),

  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const email = normalizeEmail(input.email);
      const user = await getUserByEmail(email);

      if (!user || !user.passwordHash || !user.email) {
        return { success: true, emailSent: false };
      }

      const result = await createAndSendPasswordReset(user);

      return {
        success: true,
        emailSent: result.emailSent,
      };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(10),
        password: z.string().min(6).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const resetToken = await getValidPasswordResetToken(input.token);

      if (!resetToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This password reset link is invalid or expired.",
        });
      }

      const user = await getUserById(resetToken.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      const newPasswordHash = hashPassword(input.password);

      await updateUserPassword(user.id, newPasswordHash);
      await markPasswordResetTokenUsed(resetToken.id);
      await deletePasswordResetTokensForUser(user.id);

      return { success: true };
    }),

  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      const user = await getUserByEmail(email);

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const validPassword = verifyPassword(input.password, user.passwordHash);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      if (!user.emailVerified) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Please verify your email before signing in.",
        });
      }

      const adminEmails = ["donovanmmoyo@gmail.com"].map((value) => value.toLowerCase());

      if (user.email && adminEmails.includes(user.email.toLowerCase()) && user.role !== "admin") {
        await upsertUser({
          openId: user.openId,
          role: "admin",
        });
      }

      const refreshedUser = await getUserByEmail(email);

      if (!refreshedUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load signed-in user",
        });
      }

      const sessionToken = await sdk.createSessionToken(refreshedUser.openId, {
        name: refreshedUser.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        user: refreshedUser,
      };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  setUserType: protectedProcedure
    .input(z.object({ userType: z.enum(["homeowner", "handyman"]) }))
    .mutation(async ({ ctx, input }) => {
      await updateUserType(ctx.user.id, input.userType);

      if (input.userType === "handyman") {
        const existing = await getHandymanProfile(ctx.user.id);
        if (!existing) {
          await createHandymanProfile({
            userId: ctx.user.id,
            categories: "[]",
          });
        }
      }

      if (ctx.user.email) {
        await safeSyncBrevo("setUserType", () =>
          syncUserToBrevo({
            email: ctx.user.email,
            name: ctx.user.name,
            userType: input.userType,
            marketingOptIn: ctx.user.marketingOptIn,
          })
        );
      }

      return { success: true };
    }),
});

const handymanProfilesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getHandymanProfile(ctx.user.id);
  }),

  getById: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getHandymanProfile(input.userId);
      const user = await getUserById(input.userId);

      if (!profile || !user) return null;

      return {
        ...profile,
        userName: user?.name,
        userEmail: user?.email,
      };
    }),

  getAll: publicProcedure.query(async () => {
    return getAllHandymanProfiles();
  }),

  createOrUpdate: protectedProcedure
    .input(
      z.object({
        bio: z.string().optional(),
        categories: z.array(z.string()).optional(),
        hourlyRate: z.number().optional(),
        insuranceCertUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getHandymanProfile(ctx.user.id);
      const categoriesStr = JSON.stringify(input.categories ?? []);

      if (existing) {
        await updateHandymanProfile(ctx.user.id, {
          bio: input.bio,
          categories: categoriesStr,
          hourlyRate: input.hourlyRate?.toFixed(2),
          insuranceCertUrl: input.insuranceCertUrl,
        });
      } else {
        await createHandymanProfile({
          userId: ctx.user.id,
          bio: input.bio,
          categories: categoriesStr,
          hourlyRate: input.hourlyRate?.toFixed(2),
          insuranceCertUrl: input.insuranceCertUrl,
        });
      }

      return { success: true };
    }),
});

const jobsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        description: z.string().min(10),
        category: z.string(),
        location: z.string().min(2),
        photos: z.array(z.string().url()).max(8).optional(),
        budgetMin: z.number().positive(),
        budgetMax: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.userType !== "homeowner" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only homeowners can post jobs" });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const jobId = await createJob({
        homeownerId: ctx.user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        location: input.location,
        photos: input.photos ?? [],
        budgetMin: input.budgetMin.toFixed(2),
        budgetMax: input.budgetMax.toFixed(2),
        expiresAt,
      });

      const handymanProfiles = await getAllHandymanProfiles();

      const matchingProfiles = handymanProfiles.filter((profile) => {
        try {
          const categories = JSON.parse(profile.categories ?? "[]");
          return Array.isArray(categories) && categories.includes(input.category);
        } catch {
          return false;
        }
      });

      for (const profile of matchingProfiles) {
        const handyman = await getUserById(profile.userId);
        if (!handyman) continue;

        await notifyUser({
          userId: handyman.id,
          type: "system",
          title: "New job posted",
          message: `A new ${input.category} job was posted: "${input.title}".`,
          link: `/jobs/${jobId}`,
        });

        if (handyman.email) {
          void safeSendEmail("sendNewJobPostedEmail", () =>
            sendNewJobPostedEmail({
              to: handyman.email,
              handymanName: handyman.name,
              jobTitle: input.title,
              category: input.category,
              location: input.location,
              jobId,
            })
          );
        }
      }

      return { jobId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        title: z.string().min(3).max(255),
        description: z.string().min(10),
        category: z.string(),
        location: z.string().min(2),
        photos: z.array(z.string().url()).max(8).optional(),
        budgetMin: z.number().positive(),
        budgetMax: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.homeownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (job.status !== "open") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only open jobs can be edited" });
      }

      if (job.selectedBidId || job.selectedHandymanId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This job can no longer be edited" });
      }

      await updateJob(input.jobId, {
        title: input.title,
        description: input.description,
        category: input.category,
        location: input.location,
        photos: input.photos ?? [],
        budgetMin: input.budgetMin.toFixed(2),
        budgetMax: input.budgetMax.toFixed(2),
      });

      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.homeownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (job.status !== "open") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only open jobs can be removed" });
      }

      const bidList = await getBidsForJob(input.jobId);
      if (bidList.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Jobs with bids cannot be deleted. Cancel the job instead.",
        });
      }

      const payment = await getPaymentByJob(input.jobId);
      if (payment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This job cannot be deleted because a payment record exists.",
        });
      }

      await deleteJobById(input.jobId);
      return { success: true };
    }),

  cancel: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.homeownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (job.status !== "open") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only open jobs can be cancelled" });
      }

      if (job.selectedBidId || job.selectedHandymanId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Accepted jobs cannot be cancelled from here.",
        });
      }

      await updateJobStatus(input.jobId, "cancelled");
      return { success: true };
    }),

  getByHomeowner: protectedProcedure.query(async ({ ctx }) => {
    return getJobsByHomeowner(ctx.user.id);
  }),

  getById: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const homeowner = await getUserById(job.homeownerId);
      return { ...job, homeownerName: homeowner?.name };
    }),

  getOpen: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getOpenJobs(input.limit, input.offset, input.category);
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        status: z.enum([
          "open",
          "awaiting_payment",
          "in_progress",
          "completed",
          "disputed",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.homeownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.status === "completed" && job.selectedHandymanId) {
        await releasePaymentToHandyman({
          jobId: input.jobId,
          handymanId: job.selectedHandymanId,
        });
      }

      await updateJobStatus(input.jobId, input.status);

      if (input.status === "completed" && job.selectedHandymanId) {
        await notifyUser({
          userId: job.selectedHandymanId,
          type: "job_completed",
          title: "Job completed",
          message: `Your job "${job.title}" was marked complete. Your earnings are now available for payout request.`,
          link: "/handyman/earnings",
        });

        const handyman = await getUserById(job.selectedHandymanId);
        if (handyman?.email) {
          void safeSendEmail("sendJobCompletedEmail", () =>
            sendJobCompletedEmail({
              to: handyman.email,
              handymanName: handyman.name,
              jobTitle: job.title,
            })
          );
        }
      }

      return { success: true };
    }),

  getForHandyman: protectedProcedure.query(async ({ ctx }) => {
    return getJobsForHandyman(ctx.user.id);
  }),

  categories: publicProcedure.query(() => JOB_CATEGORIES),
});

const bidsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        bidAmount: z.number().positive(),
        message: z.string().optional(),
        availability: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.userType !== "handyman" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only handymen can place bids" });
      }

      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.status !== "open") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job is not open for bids" });
      }

      const existingBids = await getBidsForJob(input.jobId);
      const alreadyBid = existingBids.find(
        (b) => b.handymanId === ctx.user.id && b.status === "pending"
      );

      if (alreadyBid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending bid on this job",
        });
      }

      const bidId = await createBid({
        jobId: input.jobId,
        handymanId: ctx.user.id,
        bidAmount: input.bidAmount.toFixed(2),
        message: input.message,
        availability: input.availability,
      });

      await notifyUser({
        userId: job.homeownerId,
        type: "new_bid",
        title: "New bid received",
        message: `${ctx.user.name ?? "A handyman"} placed a bid on "${job.title}".`,
        link: `/jobs/${job.id}`,
      });

      const homeowner = await getUserById(job.homeownerId);
      if (homeowner?.email) {
        void safeSendEmail("sendNewBidEmail", () =>
          sendNewBidEmail({
            to: homeowner.email,
            homeownerName: homeowner.name,
            handymanName: ctx.user.name,
            jobTitle: job.title,
            bidAmount: input.bidAmount,
            jobId: job.id,
          })
        );
      }

      return { bidId };
    }),

  getForJob: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      const bidList = await getBidsForJob(input.jobId);

      const enriched = await Promise.all(
        bidList.map(async (bid) => {
          const user = await getUserById(bid.handymanId);
          const profile = await getHandymanProfile(bid.handymanId);

          return {
            ...bid,
            handymanName: user?.name,
            handymanRating: profile?.rating,
            handymanTotalJobs: profile?.totalJobs,
            handymanInsuranceVerified: profile?.insuranceVerified ?? false,
          };
        })
      );

      return enriched;
    }),

  getForHandyman: protectedProcedure.query(async ({ ctx }) => {
    const bidList = await getBidsForHandyman(ctx.user.id);

    const enriched = await Promise.all(
      bidList.map(async (bid) => {
        const job = await getJobById(bid.jobId);
        return {
          ...bid,
          jobTitle: job?.title,
          jobStatus: job?.status,
          jobLocation: job?.location,
        };
      })
    );

    return enriched;
  }),

  accept: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const bid = await getBidById(input.bidId);
      if (!bid) throw new TRPCError({ code: "NOT_FOUND" });

      const job = await getJobById(bid.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.homeownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (job.status !== "open") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job is not open" });
      }

      await updateBidStatus(input.bidId, "accepted");
      await rejectOtherBids(bid.jobId, input.bidId);

      await updateJobStatus(bid.jobId, "awaiting_payment", {
        selectedHandymanId: bid.handymanId,
        selectedBidId: input.bidId,
      });

      const amount = parseFloat(bid.bidAmount);
      const platformFee = parseFloat((amount * 0.2).toFixed(2));
      const handymanPayout = parseFloat((amount * 0.8).toFixed(2));

      await createPayment({
        jobId: bid.jobId,
        homeownerId: ctx.user.id,
        handymanId: bid.handymanId,
        amount: amount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        handymanPayout: handymanPayout.toFixed(2),
        status: "pending",
      });

      await notifyUser({
        userId: bid.handymanId,
        type: "bid_accepted",
        title: "Bid accepted",
        message: `Your bid for "${job.title}" was accepted. Waiting for homeowner payment.`,
        link: "/handyman/dashboard",
      });

      const handyman = await getUserById(bid.handymanId);
      if (handyman?.email) {
        void safeSendEmail("sendBidAcceptedEmail", () =>
          sendBidAcceptedEmail({
            to: handyman.email,
            handymanName: handyman.name,
            jobTitle: job.title,
            bidAmount: amount,
            jobId: job.id,
          })
        );
      }

      return { success: true, amount, platformFee, handymanPayout };
    }),

  reject: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const bid = await getBidById(input.bidId);
      if (!bid) throw new TRPCError({ code: "NOT_FOUND" });

      const job = await getJobById(bid.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.homeownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await updateBidStatus(input.bidId, "rejected");
      return { success: true };
    }),
});

const paymentsRouter = router({
  getByJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        job.homeownerId !== ctx.user.id &&
        job.selectedHandymanId !== ctx.user.id &&
        ctx.user.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return getPaymentByJob(input.jobId);
    }),

  getHandymanEarnings: protectedProcedure.query(async ({ ctx }) => {
    const summary = await getHandymanPayoutSummary(ctx.user.id);

    return {
      payments: summary.completedPayments,
      payoutRequests: summary.payoutRequests,
      completedEarnings: summary.completedEarnings,
      pendingPayouts: summary.pendingPayouts,
      paidPayouts: summary.paidPayouts,
      availableBalance: summary.availableBalance,
      totalEarnings: summary.completedEarnings,
    };
  }),

  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        payoutEmail: z.string().email(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.userType !== "handyman" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only handymen can request payouts.",
        });
      }

      const summary = await getHandymanPayoutSummary(ctx.user.id);
      const availableBalance = parseFloat(summary.availableBalance);
      const requestedAmount = Number(input.amount.toFixed(2));

      if (requestedAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payout amount must be greater than zero.",
        });
      }

      if (requestedAmount > availableBalance) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You only have $${availableBalance.toFixed(2)} available to request.`,
        });
      }

      const payoutRequestId = await createPayoutRequest({
        handymanId: ctx.user.id,
        amount: requestedAmount.toFixed(2),
        payoutEmail: input.payoutEmail.trim(),
        notes: input.notes?.trim() || undefined,
        status: "pending",
      });

      await notifyUser({
        userId: ctx.user.id,
        type: "payout_requested",
        title: "Payout request submitted",
        message: `Your payout request for $${requestedAmount.toFixed(2)} has been submitted for review.`,
        link: "/handyman/earnings",
      });

      return {
        success: true,
        payoutRequestId,
      };
    }),

  getMyPayoutRequests: protectedProcedure.query(async ({ ctx }) => {
    return getPayoutRequestsByHandyman(ctx.user.id);
  }),

  updateStripeIntent: protectedProcedure
    .input(z.object({ jobId: z.number(), stripePaymentIntentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await getPaymentByJob(input.jobId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });

      if (payment.homeownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await updatePayment(payment.id, { stripePaymentIntentId: input.stripePaymentIntentId });

      const job = await getJobById(input.jobId);
      if (job?.selectedHandymanId) {
        await notifyUser({
          userId: job.selectedHandymanId,
          type: "payment_received",
          title: "Homeowner payment received",
          message: `The homeowner payment for "${job.title}" has been received. You can begin the job.`,
          link: "/handyman/dashboard",
        });

        const handyman = await getUserById(job.selectedHandymanId);
        if (handyman?.email) {
          void safeSendEmail("sendPaymentReceivedEmail", () =>
            sendPaymentReceivedEmail({
              to: handyman.email,
              handymanName: handyman.name,
              jobTitle: job.title,
            })
          );
        }
      }

      return { success: true };
    }),
});

const reviewsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        revieweeId: z.number(),
        rating: z.number().min(1).max(5).int(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Job must be completed before leaving a review",
        });
      }

      if (job.homeownerId !== ctx.user.id && job.selectedHandymanId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const existing = await getReviewForJob(input.jobId, ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already reviewed this job",
        });
      }

      await createReview({
        jobId: input.jobId,
        reviewerId: ctx.user.id,
        revieweeId: input.revieweeId,
        rating: input.rating,
        comment: input.comment,
      });

      if (job.selectedHandymanId === input.revieweeId) {
        await recalculateHandymanRating(input.revieweeId);
      }

      return { success: true };
    }),

  getForUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const reviewList = await getReviewsForUser(input.userId);

      const enriched = await Promise.all(
        reviewList.map(async (r) => {
          const reviewer = await getUserById(r.reviewerId);
          return { ...r, reviewerName: reviewer?.name };
        })
      );

      return enriched;
    }),

  getMyReview: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getReviewForJob(input.jobId, ctx.user.id);
    }),
});

const disputesRouter = router({
  create: protectedProcedure
    .input(z.object({ jobId: z.number(), reason: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.homeownerId !== ctx.user.id && job.selectedHandymanId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (job.status !== "in_progress" && job.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only dispute active or completed jobs",
        });
      }

      const existing = await getDisputeByJob(input.jobId);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A dispute already exists for this job",
        });
      }

      await updateJobStatus(input.jobId, "disputed");

      const disputeId = await createDispute({
        jobId: input.jobId,
        initiatedBy: ctx.user.id,
        reason: input.reason,
      });

      const otherUserId =
        job.homeownerId === ctx.user.id ? job.selectedHandymanId : job.homeownerId;

      if (otherUserId) {
        await notifyUser({
          userId: otherUserId,
          type: "dispute_opened",
          title: "Dispute opened",
          message: `A dispute was opened for "${job.title}".`,
          link: `/jobs/${job.id}`,
        });

        const otherUser = await getUserById(otherUserId);
        if (otherUser?.email) {
          void safeSendEmail("sendDisputeOpenedEmail", () =>
            sendDisputeOpenedEmail({
              to: otherUser.email,
              recipientName: otherUser.name,
              jobTitle: job.title,
              reason: input.reason,
              jobId: job.id,
            })
          );
        }
      }

      return { disputeId };
    }),

  getByJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        job.homeownerId !== ctx.user.id &&
        job.selectedHandymanId !== ctx.user.id &&
        ctx.user.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return getDisputeByJob(input.jobId);
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

    const disputeList = await getAllDisputes();

    const enriched = await Promise.all(
      disputeList.map(async (d) => {
        const job = await getJobById(d.jobId);
        const initiator = await getUserById(d.initiatedBy);
        return { ...d, jobTitle: job?.title, initiatorName: initiator?.name };
      })
    );

    return enriched;
  }),

  resolve: protectedProcedure
    .input(
      z.object({
        disputeId: z.number(),
        resolution: z.enum(["resolved_release", "resolved_refund"]),
        adminNotes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      await resolveDispute(input.disputeId, input.resolution, input.adminNotes);

      const allDisputes = await getAllDisputes();
      const dispute = allDisputes.find((d) => d.id === input.disputeId);

      if (dispute) {
        const job = await getJobById(dispute.jobId);

        if (job) {
          const payment = await getPaymentByJob(job.id);

          if (payment) {
            if (input.resolution === "resolved_release") {
              if (!job.selectedHandymanId) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "This job does not have a selected handyman.",
                });
              }

              await releasePaymentToHandyman({
                jobId: job.id,
                handymanId: job.selectedHandymanId,
              });

              await updateJobStatus(job.id, "completed");

              await notifyUser({
                userId: job.selectedHandymanId,
                type: "dispute_resolved",
                title: "Dispute resolved",
                message: `A dispute for "${job.title}" was resolved and payment was released.`,
                link: "/handyman/earnings",
              });

              await notifyUser({
                userId: job.homeownerId,
                type: "dispute_resolved",
                title: "Dispute resolved",
                message: `The dispute for "${job.title}" was resolved and payment was released to the handyman.`,
                link: `/jobs/${job.id}`,
              });

              const homeowner = await getUserById(job.homeownerId);
              const handyman = job.selectedHandymanId
                ? await getUserById(job.selectedHandymanId)
                : null;

              if (homeowner?.email) {
                void safeSendEmail("sendDisputeResolvedEmail-homeowner", () =>
                  sendDisputeResolvedEmail({
                    to: homeowner.email,
                    recipientName: homeowner.name,
                    jobTitle: job.title,
                    outcome: "Payment was released to the handyman.",
                    jobId: job.id,
                  })
                );
              }

              if (handyman?.email) {
                void safeSendEmail("sendDisputeResolvedEmail-handyman", () =>
                  sendDisputeResolvedEmail({
                    to: handyman.email,
                    recipientName: handyman.name,
                    jobTitle: job.title,
                    outcome: "Payment was released.",
                    jobId: job.id,
                  })
                );
              }
            } else {
              if (payment.stripePaymentIntentId) {
                try {
                  await stripe.refunds.create({
                    payment_intent: payment.stripePaymentIntentId,
                    reason: "requested_by_customer",
                  });
                } catch (err: any) {
                  console.error(`[Dispute] Stripe refund failed: ${err.message}`);
                }
              }

              await updatePayment(payment.id, { status: "refunded" });
              await updateJobStatus(job.id, "cancelled");

              await notifyUser({
                userId: job.homeownerId,
                type: "dispute_resolved",
                title: "Dispute resolved",
                message: `The dispute for "${job.title}" was resolved and your payment was refunded.`,
                link: `/jobs/${job.id}`,
              });

              if (job.selectedHandymanId) {
                await notifyUser({
                  userId: job.selectedHandymanId,
                  type: "dispute_resolved",
                  title: "Dispute resolved",
                  message: `The dispute for "${job.title}" was resolved and the homeowner was refunded.`,
                  link: "/handyman/dashboard",
                });
              }

              const homeowner = await getUserById(job.homeownerId);
              const handyman = job.selectedHandymanId
                ? await getUserById(job.selectedHandymanId)
                : null;

              if (homeowner?.email) {
                void safeSendEmail("sendDisputeResolvedEmail-homeowner", () =>
                  sendDisputeResolvedEmail({
                    to: homeowner.email,
                    recipientName: homeowner.name,
                    jobTitle: job.title,
                    outcome: "Your payment was refunded.",
                    jobId: job.id,
                  })
                );
              }

              if (handyman?.email) {
                void safeSendEmail("sendDisputeResolvedEmail-handyman", () =>
                  sendDisputeResolvedEmail({
                    to: handyman.email,
                    recipientName: handyman.name,
                    jobTitle: job.title,
                    outcome: "The homeowner was refunded.",
                    jobId: job.id,
                  })
                );
              }
            }
          }
        }
      }

      return { success: true };
    }),
});

const messagesRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const isHomeowner = job.homeownerId === ctx.user.id;
      const isHandyman = job.selectedHandymanId === ctx.user.id;

      if (!isHomeowner && !isHandyman) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const msg = await createMessage({
        jobId: input.jobId,
        senderId: ctx.user.id,
        content: input.content,
      });

      const recipientUserId = isHomeowner ? job.selectedHandymanId : job.homeownerId;

      if (recipientUserId) {
        await notifyUser({
          userId: recipientUserId,
          type: "new_message",
          title: "New message",
          message: `You have a new message about "${job.title}".`,
          link: "/messages",
        });

        const recipient = await getUserById(recipientUserId);
        if (recipient?.email) {
          void safeSendEmail("sendNewMessageEmail", () =>
            sendNewMessageEmail({
              to: recipient.email,
              recipientName: recipient.name,
              senderName: ctx.user.name,
              jobTitle: job.title,
              jobId: job.id,
            })
          );
        }
      }

      return { messageId: msg?.id };
    }),

  getForJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const isHomeowner = job.homeownerId === ctx.user.id;
      const isHandyman = job.selectedHandymanId === ctx.user.id;

      if (!isHomeowner && !isHandyman && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const jobMessages = await getMessagesForJob(input.jobId);

      const enriched = await Promise.all(
        jobMessages.map(async (msg) => {
          const sender = await getUserById(msg.senderId);
          return {
            ...msg,
            senderName: sender?.name,
            isRead: msg.readBy ? JSON.parse(msg.readBy).includes(ctx.user.id) : false,
          };
        })
      );

      for (const msg of jobMessages) {
        if (msg.senderId !== ctx.user.id) {
          await markMessageAsRead(msg.id, ctx.user.id);
        }
      }

      return enriched;
    }),

  getUnreadCount: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getUnreadCount(input.jobId, ctx.user.id);
    }),
});

const notificationsRouter = router({
  getMine: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return getNotificationsForUser(ctx.user.id, input?.limit ?? 20);
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadNotificationCount(ctx.user.id);
  }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});

const adminRouter = router({
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getAllUsers();
  }),

  getJobs: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return getAllJobsForAdmin();
  }),

  deleteJob: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const job = await getJobById(input.jobId);

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      await adminDeleteJobById(input.jobId);

      return { success: true };
    }),

  deleteUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      if (ctx.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own admin account.",
        });
      }

      const user = await getUserById(input.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.role === "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Admin users cannot be deleted from this action.",
        });
      }

      await deleteUserById(input.userId);

      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

    const userList = await getAllUsers();
    const openJobList = await getOpenJobs(1000);
    const disputeList = await getAllDisputes();
    const payoutRequestList = await getAllPayoutRequests();

    return {
      totalUsers: userList.length,
      homeowners: userList.filter((u) => u.userType === "homeowner").length,
      handymen: userList.filter((u) => u.userType === "handyman").length,
      openJobs: openJobList.length,
      openDisputes: disputeList.filter((d) => d.status === "open").length,
      pendingPayoutRequests: payoutRequestList.filter((p) => p.status === "pending").length,
    };
  }),

  getInsuranceQueue: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getHandymanProfilesForAdmin();
  }),

  setInsuranceVerification: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        insuranceVerified: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      await setHandymanInsuranceVerification(input.userId, input.insuranceVerified);
      return { success: true };
    }),

  getPayoutRequests: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const payoutRequestList = await getAllPayoutRequests();

    const enriched = await Promise.all(
      payoutRequestList.map(async (request) => {
        const user = await getUserById(request.handymanId);
        return {
          ...request,
          handymanName: user?.name ?? null,
          handymanEmail: user?.email ?? null,
        };
      })
    );

    return enriched;
  }),

  updatePayoutRequestStatus: protectedProcedure
    .input(
      z.object({
        payoutRequestId: z.number(),
        status: z.enum(["paid", "rejected"]),
        adminNotes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const payoutRequest = await getPayoutRequestById(input.payoutRequestId);

      if (!payoutRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payout request not found.",
        });
      }

      if (payoutRequest.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending payout requests can be updated.",
        });
      }

      await updatePayoutRequest(input.payoutRequestId, {
        status: input.status,
        adminNotes: input.adminNotes?.trim() || undefined,
        paidAt: input.status === "paid" ? new Date() : null,
      } as any);

      await notifyUser({
        userId: payoutRequest.handymanId,
        type: input.status === "paid" ? "payout_paid" : "payout_rejected",
        title: input.status === "paid" ? "Payout marked paid" : "Payout request rejected",
        message:
          input.status === "paid"
            ? `Your payout request for $${parseFloat(payoutRequest.amount).toFixed(2)} has been marked as paid.`
            : `Your payout request for $${parseFloat(payoutRequest.amount).toFixed(2)} was rejected.`,
        link: "/handyman/earnings",
      });

      const handyman = await getUserById(payoutRequest.handymanId);
      if (handyman?.email) {
        if (input.status === "paid") {
          void safeSendEmail("sendPayoutPaidEmail", () =>
            sendPayoutPaidEmail({
              to: handyman.email,
              handymanName: handyman.name,
              amount: parseFloat(payoutRequest.amount),
            })
          );
        } else {
          void safeSendEmail("sendPayoutRejectedEmail", () =>
            sendPayoutRejectedEmail({
              to: handyman.email,
              handymanName: handyman.name,
              amount: parseFloat(payoutRequest.amount),
              adminNotes: input.adminNotes ?? null,
            })
          );
        }
      }

      return { success: true };
    }),

  getFlaggedUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const users = await getAllUsers();
    const disputes = await getAllDisputes();

    const flaggedMap = new Map<
      number,
      {
        userId: number;
        name: string | null;
        email: string | null;
        reasons: string[];
        openDisputes: number;
        totalDisputes: number;
      }
    >();

    for (const dispute of disputes) {
      const job = await getJobById(dispute.jobId);
      if (!job) continue;

      const involvedUserIds = [job.homeownerId, job.selectedHandymanId].filter(
        (value): value is number => typeof value === "number"
      );

      for (const userId of involvedUserIds) {
        const user = users.find((u) => u.id === userId);
        if (!user) continue;

        const existing =
          flaggedMap.get(userId) ?? {
            userId,
            name: user.name ?? null,
            email: user.email ?? null,
            reasons: [],
            openDisputes: 0,
            totalDisputes: 0,
          };

        existing.totalDisputes += 1;

        if (dispute.status === "open") {
          existing.openDisputes += 1;
        }

        flaggedMap.set(userId, existing);
      }
    }

    const flaggedUsers = Array.from(flaggedMap.values())
      .map((item) => {
        const reasons: string[] = [];

        if (item.openDisputes > 0) {
          reasons.push(`${item.openDisputes} open dispute${item.openDisputes > 1 ? "s" : ""}`);
        }

        if (item.totalDisputes >= 2) {
          reasons.push(`${item.totalDisputes} total disputes`);
        }

        return {
          ...item,
          reasons,
        };
      })
      .filter((item) => item.reasons.length > 0)
      .sort((a, b) => {
        if (b.openDisputes !== a.openDisputes) return b.openDisputes - a.openDisputes;
        return b.totalDisputes - a.totalDisputes;
      });

    return flaggedUsers;
  }),
});

const supportRouter = router({
  getFaqs: publicProcedure.query(() => {
    return [
      {
        id: "payments",
        title: "How do payments work?",
        answer:
          "When a homeowner accepts a bid, payment is collected through Stripe and held by SaskHandy until the job is marked complete.",
      },
      {
        id: "awaiting-payment",
        title: "Why is my job awaiting payment?",
        answer:
          "That means a bid has been accepted, but the payment has not been completed or confirmed yet.",
      },
      {
        id: "disputes",
        title: "How do disputes work?",
        answer:
          "If something goes wrong during or after the job, a dispute can be opened. Admin reviews the case and can release payment or refund the homeowner.",
      },
      {
        id: "insurance",
        title: "What does insurance verified mean?",
        answer:
          "It means the handyman uploaded an insurance document and it was reviewed and approved by admin.",
      },
      {
        id: "payouts",
        title: "When does a handyman get paid?",
        answer:
          "After completed jobs, handymen can request a manual payout. Payout requests should be submitted by end of day Friday, and approved payouts are processed on Saturday.",
      },
    ];
  }),

  createTicket: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(3).max(255),
        category: z.enum(["general", "payments", "dispute", "account", "insurance", "technical"]),
        content: z.string().min(10),
        jobId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ticketId = await createSupportTicket({
        userId: ctx.user.id,
        subject: input.subject,
        category: input.category,
        content: input.content,
        jobId: input.jobId,
      });

      return { ticketId };
    }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    return getSupportTicketsForUser(ctx.user.id);
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return getAllSupportTickets();
  }),

  getById: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const ticket = await getSupportTicketById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ticket;
    }),

  getMessages: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const ticket = await getSupportTicketById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return getSupportTicketMessages(input.ticketId);
    }),

  reply: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        content: z.string().min(1).max(3000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await getSupportTicketById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = ctx.user.role === "admin";
      const isOwner = ticket.userId === ctx.user.id;

      if (!isAdmin && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await addSupportTicketMessage({
        ticketId: input.ticketId,
        senderId: ctx.user.id,
        senderRole: isAdmin ? "admin" : "user",
        content: input.content,
      });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        status: z.enum(["open", "replied", "closed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await updateSupportTicketStatus(input.ticketId, input.status);
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  handymanProfiles: handymanProfilesRouter,
  jobs: jobsRouter,
  bids: bidsRouter,
  payments: paymentsRouter,
  reviews: reviewsRouter,
  disputes: disputesRouter,
  messages: messagesRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
  support: supportRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;