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

export const JOB_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

export const PLATFORM_FEE_PERCENT = 0.2; // 20%
export const HANDYMAN_PAYOUT_PERCENT = 0.8; // 80%
