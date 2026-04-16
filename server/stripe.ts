import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-03-31.basil",
});

function getAppUrl() {
  return process.env.APP_URL || "https://saskhandy.com";
}

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
    payment_method_types: ["card"],
    transfer_group: `job_${params.jobId}`,
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

export async function createConnectedAccount(params: {
  email?: string | null;
  userId: number;
}) {
  const account = await stripe.accounts.create({
    type: "express",
    country: "CA",
    email: params.email ?? undefined,
    capabilities: {
      card_payments: {
        requested: true,
      },
      transfers: {
        requested: true,
      },
    },
    metadata: {
      userId: String(params.userId),
      platform: "SaskHandy",
    },
  });

  return account;
}

export async function createConnectedAccountOnboardingLink(params: {
  accountId: string;
}) {
  const appUrl = getAppUrl();

  const accountLink = await stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: `${appUrl}/handyman/profile?stripe=refresh`,
    return_url: `${appUrl}/handyman/profile?stripe=return`,
    type: "account_onboarding",
  });

  return accountLink;
}

export async function retrieveConnectedAccount(accountId: string) {
  return await stripe.accounts.retrieve(accountId);
}

export async function createHandymanTransfer(params: {
  amount: number;
  jobId: number;
  paymentId: number;
  destinationAccountId: string;
}) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(params.amount * 100),
    currency: "cad",
    destination: params.destinationAccountId,
    transfer_group: `job_${params.jobId}`,
    metadata: {
      jobId: String(params.jobId),
      paymentId: String(params.paymentId),
      type: "handyman_payout",
      platform: "SaskHandy",
    },
  });

  return transfer;
}