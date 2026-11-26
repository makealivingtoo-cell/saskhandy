import { matchesIntent, acceptsQuotePayment } from "../shared/paymentIntegrity";
import { reconcilePayment } from "./paymentReconciliation";
import { TRPCError } from "@trpc/server";
import { claimBookingCheckout } from "./instantBookingRouter";
import { bookingEnabled } from "../shared/instantBooking";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createPaymentIntent, retrievePaymentIntent, stripe } from "./stripe";
import {
  getBidById,
  getJobById,
  getPaymentByJob,
  getQuoteByPublicToken,
  expireQuoteIfNeeded,
  markReferralInProgressAfterQuotePayment,
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

      if (job.status !== "awaiting_payment") throw new TRPCError({code:"BAD_REQUEST",message:"This job is not awaiting payment."});
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

      if (bid.jobId!==job.id||bid.handymanId!==job.selectedHandymanId||bid.status!=="accepted"||payment.homeownerId!==job.homeownerId||payment.handymanId!==job.selectedHandymanId||Number(payment.amount)!==Number(bid.bidAmount)||payment.status==="completed"||payment.status==="refunded") throw new TRPCError({code:"CONFLICT",message:"Payment details need to be reviewed before checkout."});
      const isBooking=bookingEnabled()?await claimBookingCheckout(job.id,ctx.user.id):false;
      const amount = Number.parseFloat(payment.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payment amount",
        });
      }

      if (payment.stripePaymentIntentId) {
        const existingIntent = await retrievePaymentIntent(payment.stripePaymentIntentId);
        if(!matchesIntent(existingIntent,{id:payment.stripePaymentIntentId,amount:payment.amount,jobId:job.id,handymanId:job.selectedHandymanId,homeownerId:job.homeownerId}))throw new TRPCError({code:"CONFLICT",message:"Payment details need review."});
        if (existingIntent.status === "succeeded") {
          await reconcilePayment(existingIntent);
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

      if (isBooking&&payment.stripePaymentIntentId)throw new TRPCError({code:"CONFLICT",message:"This booking payment needs reconciliation. Do not create another payment."});
      if (bookingEnabled()) await claimBookingCheckout(job.id,ctx.user.id);
      const result = await createPaymentIntent({
        amount,
        jobId: input.jobId,
        homeownerEmail: ctx.user.email ?? "",
        homeownerName: ctx.user.name ?? "",
        homeownerId: ctx.user.id,
        handymanId: job.selectedHandymanId,
        jobTitle: job.title,
        idempotencyKey: `job_${job.id}_payment_${payment.id}_${payment.stripePaymentIntentId??"initial"}`,
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
        if (quote.referralJobId) {
          await markReferralInProgressAfterQuotePayment(quote.referralJobId);
        }
        return { clientSecret: null, paymentIntentId: quote.stripePaymentIntentId, alreadyPaid: true };
      }
      if (await expireQuoteIfNeeded(quote)) {
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
        if(!matchesIntent(existingIntent,{id:quote.stripePaymentIntentId,amount:quote.totalAmount,quoteId:quote.id,handymanId:quote.handymanId}))throw new TRPCError({code:"CONFLICT",message:"Payment details need review."});
        if (existingIntent.status === "succeeded") {
          await reconcilePayment(existingIntent);
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
        { idempotencyKey: `quote_${quote.id}_${quote.stripePaymentIntentId??"initial"}` }
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
      if (quote.status === "paid") {
        if (quote.referralJobId) {
          await markReferralInProgressAfterQuotePayment(quote.referralJobId);
        }
        return { success: true, status: "paid" as const };
      }
      if (!acceptsQuotePayment(quote.status)) throw new TRPCError({code:"BAD_REQUEST",message:"This quote is not awaiting payment."});
      if (!quote.stripePaymentIntentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No payment has been started." });
      }

      const paymentIntent = await retrievePaymentIntent(quote.stripePaymentIntentId);
      if (!matchesIntent(paymentIntent,{id:quote.stripePaymentIntentId,amount:quote.totalAmount,quoteId:quote.id,handymanId:quote.handymanId})) throw new TRPCError({code:"CONFLICT",message:"Payment details need review."});
      if (paymentIntent.status === "succeeded") {
        await reconcilePayment(paymentIntent);
        const current=await getQuoteByPublicToken(input.token);
        if(current?.status!=="paid"&&current?.status!=="completed")throw new TRPCError({code:"CONFLICT",message:"Payment needs reconciliation."});
        return {success:true,status:"paid" as const};
      }
      if (paymentIntent.status === "requires_payment_method" || paymentIntent.status === "canceled") {
        await reconcilePayment(paymentIntent);
        return {success:false,status:"payment_failed" as const};
      }

      return { success: false, status: "payment_pending" as const };
    }),
});
