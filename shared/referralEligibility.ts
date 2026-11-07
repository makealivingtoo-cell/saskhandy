export const referralAccessStatuses = [
  "active",
  "suspended",
  "blocked",
] as const;
export function referralIneligibility(person: {
  userType: string | null;
  identityVerificationStatus: string | null;
  referralAccess: string | null;
}) {
  if (person.userType !== "handyman") return "Handyman account unavailable";
  if (person.referralAccess && person.referralAccess !== "active")
    return `Referral access ${person.referralAccess}`;
  if (person.identityVerificationStatus !== "approved")
    return "ID Name Matched required";
  return null;
}
