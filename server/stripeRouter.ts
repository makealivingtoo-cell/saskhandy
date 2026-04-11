import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { createPaymentIntent, retrievePaymentIntent } from "./stripe";
import { getBidById, getJobById, getPaymentByJob, updatePayment } from "./db";

export const stripeRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      if (job.homeownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed" });
      }

      if (!job.selectedBidId || !job.selectedHandymanId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A bid must be accepted before payment can be created",
        });
      }

      const payment = await getPaymentByJob(input.jobId);
      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment record not found",
        });
      }

      const bid = await getBidById(job.selectedBidId);
      if (!bid) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Accepted bid not found",
        });
      }

      if (payment.stripePaymentIntentId) {
        const existingIntent = await retrievePaymentIntent(payment.stripePaymentIntentId);

        if (existingIntent.status === "succeeded") {
          return {
            clientSecret: null,
            paymentIntentId: existingIntent.id,
            alreadyPaid: true,
          };
        }

        if (
          existingIntent.client_secret &&
          ["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(
            existingIntent.status
          )
        ) {
          return {
            clientSecret: existingIntent.client_secret,
            paymentIntentId: existingIntent.id,
            alreadyPaid: false,
          };
        }
      }

      const result = await createPaymentIntent({
        amount: parseFloat(payment.amount),
        jobId: input.jobId,
        homeownerEmail: ctx.user.email ?? "",
        homeownerName: ctx.user.name ?? "",
        homeownerId: ctx.user.id,
        handymanId: job.selectedHandymanId,
        jobTitle: job.title,
      });

      await updatePayment(payment.id, {
        stripePaymentIntentId: result.paymentIntentId,
      });

      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        alreadyPaid: false,
      };
    }),
});