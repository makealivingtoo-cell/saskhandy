const APP_URL =
  process.env.APP_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "https://saskhandy.com";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER ?? "";

type SmsUser = {
  phoneNumber?: string | null;
  smsConsent?: boolean | null;
  smsOptedOutAt?: Date | string | null;
};

function getAppUrl(path: string) {
  const baseUrl = APP_URL.replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function normalizePhoneNumber(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
}

function canSendSms(user?: SmsUser | null) {
  return Boolean(
    user?.phoneNumber &&
      user.smsConsent === true &&
      !user.smsOptedOutAt &&
      normalizePhoneNumber(user.phoneNumber)
  );
}

async function sendSms(params: {
  to: string;
  body: string;
  label: string;
}) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn(`[SMS] ${params.label} skipped: Twilio environment variables are not configured.`);
    return;
  }

  const normalizedTo = normalizePhoneNumber(params.to);
  if (!normalizedTo) {
    console.warn(`[SMS] ${params.label} skipped: invalid phone number.`);
    return;
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString(
          "base64"
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: normalizedTo,
        From: TWILIO_FROM_NUMBER,
        Body: params.body,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Twilio SMS failed with ${response.status}: ${text}`);
  }

  console.log(`[SMS] Sent ${params.label} to ${normalizedTo}`);
}

export async function sendTransactionalSms(params: {
  label: string;
  user?: SmsUser | null;
  body: string;
}) {
  if (!canSendSms(params.user)) {
    return;
  }

  await sendSms({
    to: params.user!.phoneNumber!,
    body: params.body,
    label: params.label,
  });
}

export async function sendNewBidSms(params: {
  user?: SmsUser | null;
  jobTitle: string;
  jobId: number;
}) {
  await sendTransactionalSms({
    label: "new bid SMS",
    user: params.user,
    body: `SaskHandy: You received a new bid for "${params.jobTitle}". Review it here: ${getAppUrl(
      `/jobs/${params.jobId}`
    )}`,
  });
}

export async function sendPaymentNeededSms(params: {
  user?: SmsUser | null;
  jobTitle: string;
  jobId: number;
}) {
  await sendTransactionalSms({
    label: "payment needed SMS",
    user: params.user,
    body: `SaskHandy: Your accepted bid for "${params.jobTitle}" is waiting for secure payment. Pay here: ${getAppUrl(
      `/jobs/${params.jobId}`
    )}`,
  });
}

export async function sendPaymentReceivedSms(params: {
  user?: SmsUser | null;
  jobTitle: string;
  jobId: number;
}) {
  await sendTransactionalSms({
    label: "payment received SMS",
    user: params.user,
    body: `SaskHandy: Payment was received for "${params.jobTitle}". Please message the homeowner now to confirm arrival time: ${getAppUrl(
      `/handyman/dashboard`
    )}`,
  });
}

export async function sendNewMessageSms(params: {
  user?: SmsUser | null;
  jobTitle: string;
}) {
  await sendTransactionalSms({
    label: "new message SMS",
    user: params.user,
    body: `SaskHandy: You have a new message about "${params.jobTitle}". Reply in SaskHandy: ${getAppUrl(
      "/messages"
    )}`,
  });
}