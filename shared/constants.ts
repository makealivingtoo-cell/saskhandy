export const JOB_CATEGORIES = [
  "General Helper",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "HVAC",
  "Landscaping",
  "Cleaning",
  "Drywall",
  "Roofing",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const JOB_TIMING_PREFERENCE_VALUES = [
  "asap",
  "within_1_week",
  "within_2_4_weeks",
  "within_1_3_months",
  "flexible",
  "date_range",
] as const;

export type JobTimingPreference = (typeof JOB_TIMING_PREFERENCE_VALUES)[number];

export const JOB_TIMING_PREFERENCE_LABELS: Record<JobTimingPreference, string> = {
  asap: "As soon as possible",
  within_1_week: "Within 1 week",
  within_2_4_weeks: "Within 2–4 weeks",
  within_1_3_months: "Within 1–3 months",
  flexible: "Flexible — no rush",
  date_range: "Choose a date range",
};

function formatJobDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

export function formatJobTiming(
  preference?: string | null,
  startDate?: string | null,
  endDate?: string | null
) {
  if (!preference) return null;
  if (preference === "date_range" && startDate && endDate) {
    const formattedStart = formatJobDate(startDate);
    const formattedEnd = formatJobDate(endDate);
    return formattedStart === formattedEnd ? formattedStart : `${formattedStart} – ${formattedEnd}`;
  }

  return JOB_TIMING_PREFERENCE_LABELS[preference as JobTimingPreference] ?? null;
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

export const PLATFORM_FEE_PERCENT = 0.2; // 20%
export const HANDYMAN_PAYOUT_PERCENT = 0.8; // 80%
