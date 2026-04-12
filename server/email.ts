import nodemailer from "nodemailer";

const APP_URL = process.env.APP_URL ?? "";
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
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  name?: string | null;
  token: string;
}) {
  const transporter = getTransporter();
  const verificationUrl =
    `${APP_URL}/verify-email?token=${encodeURIComponent(params.token)}` +
    `&email=${encodeURIComponent(params.to)}`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Verify your email for SaskHandy",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Verify your email</h2>
        <p>Hello ${params.name ? params.name : ""},</p>
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