/**
 * Admin-only referral triage hints. Never changes a job, quote, or payment state.
 * All labels are derived from existing records; a reminder is only "due" when
 * an admin explicitly logged a future follow-up time.
 */
export type ReferralTriageInput = {
  status: string;
  createdAt: Date | string;
  latestQuote?: { status: string } | null;
  lastActivityAt?: Date | string | null;
  latestOutreach?: {
    note: string;
    createdAt: Date | string;
    scheduledFor?: Date | string | null;
  } | null;
};

const CLOSED = new Set(["completed", "cancelled", "declined"]);
const PAYMENT = new Set(["approved", "payment_pending", "payment_failed"]);
const QUOTE = new Set(["draft", "sent", "viewed", "declined", "expired"]);

export type ReferralFilter = "all" | "attention" | "handyman" | "quote" | "payment" | "active" | "closed";
export type FollowUpState = "overdue" | "today" | "upcoming" | null;

function validDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getFollowUpState(referral: ReferralTriageInput, now = new Date()): FollowUpState {
  if (CLOSED.has(referral.status)) return null;
  const due = validDate(referral.latestOutreach?.scheduledFor);
  if (!due) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return dueDay < today ? "overdue" : dueDay === today ? "today" : "upcoming";
}

export function getReferralStage(referral: ReferralTriageInput): Exclude<ReferralFilter, "all" | "attention"> {
  if (CLOSED.has(referral.status)) return "closed";
  const quoteStatus = referral.latestQuote?.status;
  if (quoteStatus === "paid" || quoteStatus === "completed") return "active";
  if (quoteStatus && PAYMENT.has(quoteStatus)) return "payment";
  if (referral.status === "awaiting_payment") return "payment";
  if (quoteStatus && QUOTE.has(quoteStatus)) return "quote";
  if (referral.status === "quote_sent") return "quote";
  if (referral.status === "sent" || referral.status === "accepted") return "handyman";
  return "active";
}

export function daysWithoutLoggedActivity(referral: ReferralTriageInput, now = new Date()): number {
  const started = validDate(referral.createdAt);
  if (!started) return 0;
  const last = validDate(referral.lastActivityAt);
  const reference = last && last.getTime() > started.getTime() ? last : started;
  return Math.max(0, Math.floor((now.getTime() - reference.getTime()) / 86400000));
}

export function referralNeedsAttention(referral: ReferralTriageInput, now = new Date()): boolean {
  const stage = getReferralStage(referral);
  if (stage === "closed") return false;
  const due = getFollowUpState(referral, now);
  if (due === "overdue" || due === "today") return true;
  if (referral.latestQuote?.status === "payment_failed") return true;
  if (referral.status === "sent") return true;
  // No logged update is not proof of no contact, but it merits an admin check.
  return daysWithoutLoggedActivity(referral, now) >= 3;
}

export function matchesReferralFilter(referral: ReferralTriageInput, filter: ReferralFilter, now = new Date()): boolean {
  if (filter === "all") return true;
  if (filter === "attention") return referralNeedsAttention(referral, now);
  return getReferralStage(referral) === filter;
}

export function referralTriageRank(referral: ReferralTriageInput, now = new Date()): number {
  const due = getFollowUpState(referral, now);
  if (due === "overdue") return 0;
  if (due === "today") return 1;
  if (referral.latestQuote?.status === "payment_failed") return 2;
  if (referral.status === "sent") return 3;
  if (getReferralStage(referral) !== "closed" && daysWithoutLoggedActivity(referral, now) >= 3) return 4;
  if (due === "upcoming") return 5;
  if (getReferralStage(referral) === "closed") return 9;
  return 6;
}
