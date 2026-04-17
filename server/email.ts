import nodemailer from "nodemailer";

const APP_URL =
  process.env.APP_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "";
const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !APP_URL) {
    throw new Error("Email environment variables are not fully configured");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const transporter = getTransporter();

  await withTimeout(
    transporter.sendMail({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
    12000,
    "Email send timed out"
  );
}

async function sendActionEmail(params: {
  to: string;
  subject: string;
  heading: string;
  intro?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}) {
  const safeHeading = escapeHtml(params.heading);
  const safeIntro = params.intro ? escapeHtml(params.intro) : "";
  const safeBody = escapeHtml(params.body).replace(/\n/g, "<br/>");
  const safeFooterNote = params.footerNote ? escapeHtml(params.footerNote) : "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0 auto;">
      <h2 style="margin-bottom: 12px;">${safeHeading}</h2>
      ${safeIntro ? `<p style="margin: 0 0 14px 0;">${safeIntro}</p>` : ""}
      <p style="margin: 0 0 18px 0;">${safeBody}</p>

      ${
        params.ctaLabel && params.ctaUrl
          ? `
            <p style="margin: 0 0 18px 0;">
              <a
                href="${params.ctaUrl}"
                style="display:inline-block;padding:12px 18px;background:#047857;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;"
              >
                ${escapeHtml(params.ctaLabel)}
              </a>
            </p>
          `
          : ""
      }

      ${
        params.ctaUrl
          ? `<p style="margin: 0 0 14px 0; font-size: 13px; color: #6b7280;">If the button does not work, use this link:<br/><a href="${params.ctaUrl}">${params.ctaUrl}</a></p>`
          : ""
      }

      ${
        safeFooterNote
          ? `<p style="margin-top: 18px; font-size: 13px; color: #6b7280;">${safeFooterNote}</p>`
          : ""
      }
    </div>
  `;

  const text = [
    params.heading,
    params.intro ?? "",
    params.body,
    params.ctaUrl ? `${params.ctaLabel ?? "Open"}: ${params.ctaUrl}` : "",
    params.footerNote ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  await sendEmail({
    to: params.to,
    subject: params.subject,
    html,
    text,
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  name?: string | null;
  token: string;
}) {
  const verificationUrl =
    `${APP_URL}/verify-email?token=${encodeURIComponent(params.token)}` +
    `&email=${encodeURIComponent(params.to)}`;

  await sendEmail({
    to: params.to,
    subject: "Verify your email for SaskHandy",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Verify your email</h2>
        <p>Hello ${params.name ? escapeHtml(params.name) : ""},</p>
        <p>Thanks for creating your SaskHandy account. Please verify your email address by clicking the button below.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
    text: `Verify your email for SaskHandy: ${verificationUrl}`,
  });
}

export async function sendNewBidEmail(params: {
  to: string;
  homeownerName?: string | null;
  handymanName?: string | null;
  jobTitle: string;
  bidAmount: number;
  jobId?: number;
}) {
  const ctaUrl = params.jobId ? `${APP_URL}/jobs/${params.jobId}` : `${APP_URL}/dashboard`;

  await sendActionEmail({
    to: params.to,
    subject: `New bid received for "${params.jobTitle}"`,
    heading: "You received a new bid",
    intro: params.homeownerName ? `Hi ${params.homeownerName},` : undefined,
    body: `${params.handymanName ?? "A handyman"} placed a bid of $${params.bidAmount.toFixed(
      2
    )} on "${params.jobTitle}". Review the bid and decide whether you want to accept it.`,
    ctaLabel: "Review Bid",
    ctaUrl,
  });
}

export async function sendBidAcceptedEmail(params: {
  to: string;
  handymanName?: string | null;
  jobTitle: string;
  bidAmount: number;
  jobId?: number;
}) {
  const ctaUrl = `${APP_URL}/handyman/dashboard`;

  await sendActionEmail({
    to: params.to,
    subject: `Your bid was accepted for "${params.jobTitle}"`,
    heading: "Your bid was accepted",
    intro: params.handymanName ? `Hi ${params.handymanName},` : undefined,
    body: `Your bid of $${params.bidAmount.toFixed(
      2
    )} for "${params.jobTitle}" was accepted. The job will move forward once the homeowner completes payment.`,
    ctaLabel: "View Dashboard",
    ctaUrl,
  });
}

export async function sendPaymentReceivedEmail(params: {
  to: string;
  handymanName?: string | null;
  jobTitle: string;
}) {
  await sendActionEmail({
    to: params.to,
    subject: `Homeowner payment received for "${params.jobTitle}"`,
    heading: "Payment received",
    intro: params.handymanName ? `Hi ${params.handymanName},` : undefined,
    body: `The homeowner payment for "${params.jobTitle}" has been received. You can begin the job.`,
    ctaLabel: "Open Dashboard",
    ctaUrl: `${APP_URL}/handyman/dashboard`,
  });
}

export async function sendNewMessageEmail(params: {
  to: string;
  recipientName?: string | null;
  senderName?: string | null;
  jobTitle: string;
  jobId?: number;
}) {
  await sendActionEmail({
    to: params.to,
    subject: `New message about "${params.jobTitle}"`,
    heading: "You have a new message",
    intro: params.recipientName ? `Hi ${params.recipientName},` : undefined,
    body: `${params.senderName ?? "Someone"} sent you a new message about "${
      params.jobTitle
    }".`,
    ctaLabel: "Open Messages",
    ctaUrl: `${APP_URL}/messages`,
  });
}

export async function sendJobCompletedEmail(params: {
  to: string;
  handymanName?: string | null;
  jobTitle: string;
}) {
  await sendActionEmail({
    to: params.to,
    subject: `Job completed: "${params.jobTitle}"`,
    heading: "Job marked complete",
    intro: params.handymanName ? `Hi ${params.handymanName},` : undefined,
    body: `The homeowner marked "${params.jobTitle}" as complete. Your earnings are now available for payout request.`,
    ctaLabel: "View Earnings",
    ctaUrl: `${APP_URL}/handyman/earnings`,
  });
}

export async function sendPayoutPaidEmail(params: {
  to: string;
  handymanName?: string | null;
  amount: number;
}) {
  await sendActionEmail({
    to: params.to,
    subject: "Your payout was marked as paid",
    heading: "Payout marked paid",
    intro: params.handymanName ? `Hi ${params.handymanName},` : undefined,
    body: `Your payout request for $${params.amount.toFixed(
      2
    )} has been marked as paid.`,
    ctaLabel: "View Earnings",
    ctaUrl: `${APP_URL}/handyman/earnings`,
  });
}

export async function sendPayoutRejectedEmail(params: {
  to: string;
  handymanName?: string | null;
  amount: number;
  adminNotes?: string | null;
}) {
  await sendActionEmail({
    to: params.to,
    subject: "Your payout request was rejected",
    heading: "Payout request rejected",
    intro: params.handymanName ? `Hi ${params.handymanName},` : undefined,
    body: `Your payout request for $${params.amount.toFixed(2)} was rejected.${
      params.adminNotes ? `\n\nAdmin notes: ${params.adminNotes}` : ""
    }`,
    ctaLabel: "View Earnings",
    ctaUrl: `${APP_URL}/handyman/earnings`,
  });
}

export async function sendDisputeOpenedEmail(params: {
  to: string;
  recipientName?: string | null;
  jobTitle: string;
  reason?: string | null;
  jobId?: number;
}) {
  const ctaUrl = params.jobId ? `${APP_URL}/jobs/${params.jobId}` : `${APP_URL}/dashboard`;

  await sendActionEmail({
    to: params.to,
    subject: `Dispute opened for "${params.jobTitle}"`,
    heading: "A dispute was opened",
    intro: params.recipientName ? `Hi ${params.recipientName},` : undefined,
    body: `A dispute was opened for "${params.jobTitle}".${
      params.reason ? `\n\nReason: ${params.reason}` : ""
    }\n\nOur team will review and resolve it as soon as possible.`,
    ctaLabel: "View Job",
    ctaUrl,
  });
}

export async function sendDisputeResolvedEmail(params: {
  to: string;
  recipientName?: string | null;
  jobTitle: string;
  outcome: string;
  jobId?: number;
}) {
  const ctaUrl = params.jobId ? `${APP_URL}/jobs/${params.jobId}` : `${APP_URL}/dashboard`;

  await sendActionEmail({
    to: params.to,
    subject: `Dispute resolved for "${params.jobTitle}"`,
    heading: "Dispute resolved",
    intro: params.recipientName ? `Hi ${params.recipientName},` : undefined,
    body: `The dispute for "${params.jobTitle}" has been resolved.\n\nOutcome: ${params.outcome}`,
    ctaLabel: "View Details",
    ctaUrl,
  });
}