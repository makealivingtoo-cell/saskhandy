import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export { stripe };

export async function createPaymentIntent(params: {
  amount: number;
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
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      jobId: params.jobId.toString(),
      homeownerId: params.homeownerId.toString(),
      handymanId: params.handymanId.toString(),
      homeownerEmail: params.homeownerEmail,
      homeownerName: params.homeownerName,
      jobTitle: params.jobTitle,
      source: "saskhandy_escrow",
    },
    receipt_email: params.homeownerEmail || undefined,
  });

  if (!intent.client_secret) {
    throw new Error("Stripe did not return a client secret");
  }

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );
}