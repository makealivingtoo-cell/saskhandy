import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createPaymentIntent, retrievePaymentIntent, stripe } from "./stripe";
import {
  getBidById,
  getJobById,
  getPaymentByJob,
  getQuoteByPublicToken,
  updatePayment,
  updateQuote,
  updateQuoteStatus,
} from "./db";

export const stripeRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      if (job.homeownerId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not allowed",
        });
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

      const amount = Number.parseFloat(payment.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payment amount",
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
          [
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
            "processing",
          ].includes(existingIntent.status)
        ) {
          return {
            clientSecret: existingIntent.client_secret,
            paymentIntentId: existingIntent.id,
            alreadyPaid: false,
          };
        }
      }

      const result = await createPaymentIntent({
        amount,
        jobId: input.jobId,
        homeownerEmail: ctx.user.email ?? "",
        homeownerName: ctx.user.name ?? "",
        homeownerId: ctx.user.id,
        handymanId: job.selectedHandymanId,
        jobTitle: job.title,
      });

      await updatePayment(payment.id, {
        stripePaymentIntentId: result.paymentIntentId,
        status: "pending",
      });

      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        alreadyPaid: false,
      };
    }),

  createQuotePaymentIntent: publicProcedure
    .input(z.object({ token: z.string().min(64).max(128) }))
    .mutation(async ({ input }) => {
      const quote = await getQuoteByPublicToken(input.token);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found." });
      if (quote.status === "paid") {
        return { clientSecret: null, paymentIntentId: quote.stripePaymentIntentId, alreadyPaid: true };
      }
      if (quote.expiresAt && quote.expiresAt.getTime() < Date.now()) {
        if (quote.status !== "expired") await updateQuoteStatus(quote.id, "expired");
        throw new TRPCError({ code: "BAD_REQUEST", message: "This quote has expired." });
      }
      if (!["approved", "payment_pending", "payment_failed"].includes(quote.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Approve the quote before starting payment.",
        });
      }

      if (quote.stripePaymentIntentId) {
        const existingIntent = await retrievePaymentIntent(quote.stripePaymentIntentId);
        if (existingIntent.status === "succeeded") {
          await updateQuoteStatus(quote.id, "paid");
          return {
            clientSecret: null,
            paymentIntentId: existingIntent.id,
            alreadyPaid: true,
          };
        }

        if (
          existingIntent.client_secret &&
          [
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
            "processing",
          ].includes(existingIntent.status)
        ) {
          return {
            clientSecret: existingIntent.client_secret,
            paymentIntentId: existingIntent.id,
            alreadyPaid: false,
          };
        }
      }

      const amount = Number.parseFloat(quote.totalAmount);
      const amountInCents = Math.round(amount * 100);
      if (!Number.isFinite(amount) || amountInCents < 50 || amountInCents > 99_999_999) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid quote payment amount." });
      }

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: "cad",
          payment_method_types: ["card"],
          description: `SaskHandy quote: ${quote.title}`,
          metadata: {
            quoteId: String(quote.id),
            handymanId: String(quote.handymanId),
            sourceType: quote.sourceType,
            referralJobId: quote.referralJobId ? String(quote.referralJobId) : "",
          },
        },
        { idempotencyKey: `quote_${quote.id}_${Math.floor(Date.now() / 1000)}` }
      );

      if (!paymentIntent.client_secret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe did not return a payment client secret.",
        });
      }

      await updateQuote(quote.id, { stripePaymentIntentId: paymentIntent.id });
      await updateQuoteStatus(quote.id, "payment_pending");

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        alreadyPaid: false,
      };
    }),

  confirmQuotePayment: publicProcedure
    .input(z.object({ token: z.string().min(64).max(128) }))
    .mutation(async ({ input }) => {
      const quote = await getQuoteByPublicToken(input.token);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found." });
      if (quote.status === "paid") return { success: true, status: "paid" as const };
      if (!quote.stripePaymentIntentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No payment has been started." });
      }

      const paymentIntent = await retrievePaymentIntent(quote.stripePaymentIntentId);
      if (paymentIntent.metadata.quoteId !== String(quote.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Payment does not match this quote." });
      }

      if (paymentIntent.status === "succeeded") {
        await updateQuoteStatus(quote.id, "paid");
        return { success: true, status: "paid" as const };
      }
      if (paymentIntent.status === "requires_payment_method" || paymentIntent.status === "canceled") {
        await updateQuoteStatus(quote.id, "payment_failed");
        return { success: false, status: "payment_failed" as const };
      }

      return { success: false, status: "payment_pending" as const };
    }),
});
