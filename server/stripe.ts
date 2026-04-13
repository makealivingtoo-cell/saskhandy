import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-03-31.basil",
});

export async function createPaymentIntent(params: {
  amount: number;
  jobId: number;
  homeownerEmail: string;
  homeownerName: string;
  homeownerId: number;
  handymanId: number;
  jobTitle: string;
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100),
    currency: "cad",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      jobId: String(params.jobId),
      homeownerEmail: params.homeownerEmail,
      homeownerName: params.homeownerName,
      homeownerId: String(params.homeownerId),
      handymanId: String(params.handymanId),
      jobTitle: params.jobTitle,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

export function constructWebhookEvent(body: string | Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}