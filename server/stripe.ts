import Stripe from "stripe";
import { ENV } from "./_core/env";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export { stripe };

/**
 * Create a Stripe PaymentIntent for a job bid acceptance.
 * The full bid amount is charged; 80% goes to handyman, 20% to platform.
 */
export async function createPaymentIntent(params: {
  amount: number; // in dollars
  jobId: number;
  homeownerEmail: string;
  homeownerName: string;
  homeownerId: number;
  handymanId: number;
  jobTitle: string;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const amountCents = Math.round(params.amount * 100);

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "cad",
    description: `SaskHandy Escrow: ${params.jobTitle}`,
    metadata: {
      jobId: params.jobId.toString(),
      homeownerId: params.homeownerId.toString(),
      handymanId: params.handymanId.toString(),
      homeownerEmail: params.homeownerEmail,
      homeownerName: params.homeownerName,
    },
    receipt_email: params.homeownerEmail,
  });

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
  };
}

/**
 * Verify a webhook signature and return the event.
 */
export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );
}
