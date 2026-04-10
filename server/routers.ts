import { TRPCError } from "@trpc/server";
import { stripeRouter } from "./stripeRouter";
import { stripe } from "./stripe";
import { createMessage, getMessagesForJob, markMessageAsRead, getUnreadCount } from "./db-messages";
import { sendNotification } from "./notifications";
import { z } from "zod";
import {
  createBid,
  createDispute,
  createJob,
  createPayment,
  createReview,
  getAllDisputes,
  getAllHandymanProfiles,
  getAllUsers,
  getBidById,
  getBidsForHandyman,
  getBidsForJob,
  getDisputeByJob,
  getHandymanProfile,
  getJobById,
  getJobsByHomeowner,
  getJobsForHandyman,
  getOpenJobs,
  getPaymentByJob,
  getPaymentsByHandyman,
  getReviewForJob,
  getReviewsForUser,
  getUserById,
  recalculateHandymanRating,
  rejectOtherBids,
  resolveDispute,
  updateBidStatus,
  updateHandymanProfile,
  updateJobStatus,
  updatePayment,
  updateUserType,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

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

// ─── Auth Router ──────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  setUserType: protectedProcedure
    .input(z.object({ userType: z.enum(["homeowner", "handyman"]) }))
    .mutation(async ({ ctx, input }) => {
      await updateUserType(ctx.user.id, input.userType);
      return { success: true };
    }),
});

// ─── Handyman Profiles Router ─────────────────────────────────────────────────
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
      return { ...profile, userName: user.name, userEmail: user.email };
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
        const { createHandymanProfile } = await import("./db");
        await createHandymanProfile({
          userId: ctx.user.id,
          bio: input.bio,
          categories: categoriesStr,
          hourlyRate: input.hourlyRate?.toFixed(2),
        });
      }
      return { success: true };
    }),
});

// ─── Jobs Router ──────────────────────────────────────────────────────────────
const jobsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        description: z.string().min(10),
        category: z.string(),
        location: z.string().min(2),
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
        budgetMin: input.budgetMin.toFixed(2),
        budgetMax: input.budgetMax.toFixed(2),
        expiresAt,
      });
      return { jobId };
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
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0), category: z.string().optional() }))
    .query(async ({ input }) => {
      return getOpenJobs(input.limit, input.offset, input.category);
    }),

  updateStatus: protectedProcedure
    .input(z.object({ jobId: z.number(), status: z.enum(["open", "in_progress", "completed", "disputed", "cancelled"]) }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.homeownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await updateJobStatus(input.jobId, input.status);

      // On completion, update handyman stats and release payment
      if (input.status === "completed" && job.selectedHandymanId) {
        const payment = await getPaymentByJob(input.jobId);
        if (payment && payment.status === "pending") {
          await updatePayment(payment.id, { status: "completed" });
          // Update handyman earnings and job count
          const profile = await getHandymanProfile(job.selectedHandymanId);
          if (profile) {
            const newEarnings = (parseFloat(profile.totalEarnings ?? "0") + parseFloat(payment.handymanPayout)).toFixed(2);
            await updateHandymanProfile(job.selectedHandymanId, {
              totalJobs: (profile.totalJobs ?? 0) + 1,
              totalEarnings: newEarnings,
            });
          }
        }

        await sendNotification("job_completed", {
          jobId: job.id,
          jobTitle: job.title,
        });
      }
      return { success: true };
    }),

  getForHandyman: protectedProcedure.query(async ({ ctx }) => {
    return getJobsForHandyman(ctx.user.id);
  }),

  categories: publicProcedure.query(() => JOB_CATEGORIES),
});

// ─── Bids Router ──────────────────────────────────────────────────────────────
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
      if (job.status !== "open") throw new TRPCError({ code: "BAD_REQUEST", message: "Job is not open for bids" });

      // Check for existing bid
      const existingBids = await getBidsForJob(input.jobId);
      const alreadyBid = existingBids.find((b) => b.handymanId === ctx.user.id && b.status === "pending");
      if (alreadyBid) throw new TRPCError({ code: "BAD_REQUEST", message: "You already have a pending bid on this job" });

      const bidId = await createBid({
        jobId: input.jobId,
        handymanId: ctx.user.id,
        bidAmount: input.bidAmount.toFixed(2),
        message: input.message,
        availability: input.availability,
      });

      await sendNotification("new_bid_received", {
        jobId: job.id,
        jobTitle: job.title,
        userName: ctx.user.name ?? "A handyman",
        bidAmount: input.bidAmount,
        message: input.message,
      });

      return { bidId };
    }),

  getForJob: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      const bidList = await getBidsForJob(input.jobId);
      // Enrich with handyman info
      const enriched = await Promise.all(
        bidList.map(async (bid) => {
          const user = await getUserById(bid.handymanId);
          const profile = await getHandymanProfile(bid.handymanId);
          return {
            ...bid,
            handymanName: user?.name,
            handymanRating: profile?.rating,
            handymanTotalJobs: profile?.totalJobs,
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
        return { ...bid, jobTitle: job?.title, jobStatus: job?.status, jobLocation: job?.location };
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
      if (job.homeownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (job.status !== "open") throw new TRPCError({ code: "BAD_REQUEST", message: "Job is not open" });

      // Accept bid and reject others
      await updateBidStatus(input.bidId, "accepted");
      await rejectOtherBids(bid.jobId, input.bidId);

      // Update job status
      await updateJobStatus(bid.jobId, "in_progress", {
        selectedHandymanId: bid.handymanId,
        selectedBidId: input.bidId,
      });

      // Create escrow payment record (80/20 split)
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

      await sendNotification("bid_accepted", {
        jobId: job.id,
        jobTitle: job.title,
        bidAmount: amount,
      });

      return { success: true, amount, platformFee, handymanPayout };
    }),

  reject: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const bid = await getBidById(input.bidId);
      if (!bid) throw new TRPCError({ code: "NOT_FOUND" });
      const job = await getJobById(bid.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.homeownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateBidStatus(input.bidId, "rejected");
      return { success: true };
    }),
});

// ─── Payments Router ──────────────────────────────────────────────────────────
const paymentsRouter = router({
  getByJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.homeownerId !== ctx.user.id && job.selectedHandymanId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getPaymentByJob(input.jobId);
    }),

  getHandymanEarnings: protectedProcedure.query(async ({ ctx }) => {
    const paymentList = await getPaymentsByHandyman(ctx.user.id);
    const total = paymentList.reduce((sum, p) => sum + parseFloat(p.handymanPayout), 0);
    return { payments: paymentList, totalEarnings: total.toFixed(2) };
  }),

  updateStripeIntent: protectedProcedure
    .input(z.object({ jobId: z.number(), stripePaymentIntentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await getPaymentByJob(input.jobId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      if (payment.homeownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updatePayment(payment.id, { stripePaymentIntentId: input.stripePaymentIntentId });
      return { success: true };
    }),
});

// ─── Reviews Router ───────────────────────────────────────────────────────────
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job must be completed before leaving a review" });
      }
      // Verify reviewer is part of the job
      if (job.homeownerId !== ctx.user.id && job.selectedHandymanId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // Check for duplicate review
      const existing = await getReviewForJob(input.jobId, ctx.user.id);
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "You already reviewed this job" });

      await createReview({
        jobId: input.jobId,
        reviewerId: ctx.user.id,
        revieweeId: input.revieweeId,
        rating: input.rating,
        comment: input.comment,
      });

      // Recalculate handyman rating if reviewee is handyman
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

// ─── Disputes Router ──────────────────────────────────────────────────────────
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only dispute active or completed jobs" });
      }
      const existing = await getDisputeByJob(input.jobId);
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "A dispute already exists for this job" });

      await updateJobStatus(input.jobId, "disputed");
      const disputeId = await createDispute({
        jobId: input.jobId,
        initiatedBy: ctx.user.id,
        reason: input.reason,
      });

      await sendNotification("dispute_opened", {
        jobId: job.id,
        jobTitle: job.title,
        userName: ctx.user.name ?? "A user",
        message: input.reason,
      });

      return { disputeId };
    }),

  getByJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.homeownerId !== ctx.user.id && job.selectedHandymanId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getDisputeByJob(input.jobId);
    }),

  // Admin only
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

      // Get dispute to find job
      const allDisputes = await getAllDisputes();
      const dispute = allDisputes.find((d) => d.id === input.disputeId);
      if (dispute) {
        const job = await getJobById(dispute.jobId);
        if (job) {
          const payment = await getPaymentByJob(job.id);
          if (payment) {
            if (input.resolution === "resolved_release") {
              await updatePayment(payment.id, { status: "completed" });
              await updateJobStatus(job.id, "completed");
              // Update handyman stats
              if (job.selectedHandymanId) {
                const profile = await getHandymanProfile(job.selectedHandymanId);
                if (profile) {
                  const newEarnings = (parseFloat(profile.totalEarnings ?? "0") + parseFloat(payment.handymanPayout)).toFixed(2);
                  await updateHandymanProfile(job.selectedHandymanId, {
                    totalJobs: (profile.totalJobs ?? 0) + 1,
                    totalEarnings: newEarnings,
                  });
                }
              }
            } else {
              // Issue Stripe refund if payment was captured
              if (payment.stripePaymentIntentId) {
                try {
                  await stripe.refunds.create({
                    payment_intent: payment.stripePaymentIntentId,
                    reason: "fraudulent",
                  });
                  console.log(`[Dispute] Stripe refund issued for job ${job.id}`);
                } catch (err: any) {
                  console.error(`[Dispute] Stripe refund failed: ${err.message}`);
                }
              }
              await updatePayment(payment.id, { status: "refunded" });
              await updateJobStatus(job.id, "cancelled");
            }
          }
        }
      }
      return { success: true };
    }),
});

// ─── Messages Router ─────────────────────────────────────────────────────────────
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

      // Only homeowner and accepted handyman can message
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

      // Mark all messages as read for current user
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

// ─── Admin Router ─────────────────────────────────────────────────────────────
const adminRouter = router({
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getAllUsers();
  }),
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const userList = await getAllUsers();
    const openJobList = await getOpenJobs(1000);
    const disputeList = await getAllDisputes();
    return {
      totalUsers: userList.length,
      homeowners: userList.filter((u) => u.userType === "homeowner").length,
      handymen: userList.filter((u) => u.userType === "handyman").length,
      openJobs: openJobList.length,
      openDisputes: disputeList.filter((d) => d.status === "open").length,
    };
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
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
  admin: adminRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
