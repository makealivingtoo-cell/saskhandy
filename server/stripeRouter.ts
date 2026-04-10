import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { createPaymentIntent } from "./stripe";
import { getBidById, getJobById, getPaymentByJob, updatePayment } from "./db";

export const stripeRouter = router({
  /**
   * Create a PaymentIntent for escrow payment when a bid is accepted.
   * Returns the Stripe client secret for frontend confirmation.
   */
  createPaymentIntent: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.homeownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (!job.selectedBidId) throw new TRPCError({ code: "BAD_REQUEST", message: "No bid accepted yet" });

      const payment = await getPaymentByJob(input.jobId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment record not found" });

      // If already has a Stripe intent, return it
      if (payment.stripePaymentIntentId) {
        return { clientSecret: null, paymentIntentId: payment.stripePaymentIntentId, alreadyPaid: true };
      }

      const bid = await getBidById(job.selectedBidId);
      if (!bid) throw new TRPCError({ code: "NOT_FOUND" });

      const result = await createPaymentIntent({
        amount: parseFloat(payment.amount),
        jobId: input.jobId,
        homeownerEmail: ctx.user.email ?? "",
        homeownerName: ctx.user.name ?? "",
        homeownerId: ctx.user.id,
        handymanId: job.selectedHandymanId!,
        jobTitle: job.title,
      });

      // Store the payment intent ID
      await updatePayment(payment.id, { stripePaymentIntentId: result.paymentIntentId });

      return { clientSecret: result.clientSecret, paymentIntentId: result.paymentIntentId, alreadyPaid: false };
    }),
});
