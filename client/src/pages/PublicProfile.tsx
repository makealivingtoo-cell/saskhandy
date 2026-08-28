import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Flag,
  Loader2,
  MapPin,
  Shield,
  Star,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

function ProfileAvatar({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name: string;
}) {
  const displayInitial = name.charAt(0).toUpperCase() || "H";

  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-border/60">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} profile`}
          className="w-full h-full object-cover"
        />
      ) : displayInitial ? (
        <span className="text-3xl font-bold text-primary">{displayInitial}</span>
      ) : (
        <User className="w-8 h-8 text-primary" />
      )}
    </div>
  );
}

function getIdentityChecked(profile: any) {
  return (
    profile?.identityChecked === true ||
    profile?.idNameMatched === true ||
    profile?.identityVerificationStatus === "approved" ||
    profile?.idVerificationStatus === "approved"
  );
}

function getGoldShieldVerified(profile: any) {
  return getIdentityChecked(profile) && profile?.criminalRecordCheckStatus === "reviewed";
}

function getExternalReviewLinks(profile: any) {
  return [
    { label: "Google reviews", url: profile?.externalGoogleReviewsUrl },
    { label: "Facebook reviews", url: profile?.externalFacebookReviewsUrl },
    { label: "Portfolio / website", url: profile?.externalWebsiteUrl },
  ].filter((item) => Boolean(item.url));
}

function getReviewCount(profile: any, reviewsLength: number) {
  if (typeof profile?.reviewCount === "number") return profile.reviewCount;
  if (typeof profile?.totalReviews === "number") return profile.totalReviews;
  return reviewsLength;
}

function parseCategories(value?: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export default function PublicProfile() {
  const { userId } = useParams();
  const uid = Number.parseInt(userId ?? "0", 10);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<
    | "unsafe"
    | "suspicious_profile"
    | "off_platform_payment"
    | "false_information"
    | "other"
  >("unsafe");
  const [reportDetails, setReportDetails] = useState("");

  const { data: profile, isLoading: profileLoading } = trpc.handymanProfiles.getById.useQuery(
    { userId: uid },
    { enabled: uid > 0 }
  );

  const { data: reviews, isLoading: reviewsLoading } = trpc.reviews.getForUser.useQuery(
    { userId: uid },
    { enabled: uid > 0 }
  );

  const createReport = trpc.reports.create.useMutation({
    onSuccess: () => {
      toast.success("Report received. The SaskHandy team will review it.");
      setReportOpen(false);
      setReportReason("unsafe");
      setReportDetails("");
    },
    onError: (error) => {
      toast.error(
        error.data?.code === "UNAUTHORIZED"
          ? "Please sign in before reporting a profile."
          : error.message || "We couldn't submit your report. Please try again."
      );
    },
  });

  const categories = useMemo<string[]>(
    () => parseCategories(profile?.categories),
    [profile?.categories]
  );

  const safeReviews = reviews ?? [];

  if (!uid) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Invalid profile.</p>
        </div>
      </AppLayout>
    );
  }

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Profile not found.</p>
        </div>
      </AppLayout>
    );
  }

  const displayName = profile.userName?.trim() || "Handyman";
  const ratingValue = profile.rating ? Number.parseFloat(profile.rating) : 0;
  const hourlyRateValue = profile.hourlyRate ? Number.parseFloat(profile.hourlyRate) : null;
  const reviewCount = getReviewCount(profile, safeReviews.length);
  const completedJobs = profile.totalJobs ?? 0;
  const isNewToSaskHandy = completedJobs === 0;
  const hasNoReviews = reviewCount === 0 && ratingValue === 0;
  const identityChecked = getIdentityChecked(profile);
  const criminalRecordCheckReviewed = profile.criminalRecordCheckStatus === "reviewed";
  const tradeLicenseVerified = profile.tradeLicenseVerificationStatus === "approved";
  const insuranceReviewed = profile.insuranceVerified === true;
  const goldShieldVerified = getGoldShieldVerified(profile);
  const externalReviewLinks = getExternalReviewLinks(profile);

  const trustSignals = [
    identityChecked
      ? {
          label: "ID name matched",
          detail: "SaskHandy reviewed ID and matched it to the profile name.",
        }
      : null,
    criminalRecordCheckReviewed
      ? {
          label: "Criminal record check reviewed",
          detail: "A submitted criminal record check was reviewed by SaskHandy.",
        }
      : null,
    tradeLicenseVerified
      ? {
          label: profile.tradeLicenseType
            ? `${profile.tradeLicenseType} licence verified`
            : "Trade licence verified",
          detail: "Trade licence information was reviewed for this profile.",
        }
      : null,
    insuranceReviewed
      ? {
          label: "Insurance reviewed",
          detail: "An insurance document was submitted and reviewed.",
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; detail: string }>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <section className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-4 sm:gap-5">
              <ProfileAvatar imageUrl={profile.profileImageUrl} name={displayName} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-serif text-foreground">{displayName}</h1>
                  {goldShieldVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      <Shield className="w-3.5 h-3.5" />
                      Gold Shield
                    </span>
                  )}
                  {isNewToSaskHandy && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      New to SaskHandy
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-x-4 gap-y-2 flex-wrap text-sm">
                  {ratingValue > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <StarRatingDisplay rating={ratingValue} showValue />
                      <span className="text-muted-foreground">
                        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No SaskHandy rating yet</span>
                  )}

                  <span className="text-muted-foreground">
                    <Briefcase className="w-3.5 h-3.5 inline mr-1" />
                    {completedJobs} {completedJobs === 1 ? "job" : "jobs"} completed
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-4 flex-wrap text-sm">
                  {profile.serviceArea && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.serviceArea}
                    </span>
                  )}
                  {hourlyRateValue !== null && !Number.isNaN(hourlyRateValue) && (
                    <span className="font-semibold text-foreground">
                      ${hourlyRateValue.toFixed(0)}/hr
                    </span>
                  )}
                </div>
              </div>
            </div>

            {profile.bio?.trim() && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-foreground mb-2">About</h2>
                <p className="text-sm text-muted-foreground leading-6">{profile.bio}</p>
              </div>
            )}

            {categories.length > 0 && (
              <div className="mt-5">
                <h2 className="text-sm font-semibold text-foreground mb-2.5">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border/50 bg-muted/20 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-semibold text-foreground">Trust & verification</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Signals SaskHandy has reviewed for this profile.
                </p>
              </div>
              {trustSignals.length > 0 && (
                <span className="text-xs font-semibold text-primary shrink-0">
                  {trustSignals.length} {trustSignals.length === 1 ? "signal" : "signals"}
                </span>
              )}
            </div>

            {trustSignals.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {trustSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-xl border border-border/60 bg-white p-3.5 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{signal.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {signal.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-white p-4">
                <p className="text-sm font-medium text-foreground">No optional trust checks shown yet</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Review their experience, messages and any past-work links before deciding.
                </p>
              </div>
            )}

            {goldShieldVerified && (
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Gold Shield</strong> means both the ID name match and criminal record check review are complete. Trust signals help you decide, but they are not a guarantee of safety or work quality.
              </p>
            )}

            {externalReviewLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Past work & external reviews</p>
                <div className="flex flex-wrap gap-2">
                  {externalReviewLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  External links are supplied by the handyman. Review them independently.
                </p>
              </div>
            )}

            {hasNoReviews && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="text-sm font-medium text-amber-900">No SaskHandy reviews yet</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  This can simply mean they are new to the platform. Use bid chat to ask about relevant experience and review any past-work links before choosing.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-foreground">SaskHandy reviews</h2>
              {safeReviews.length > 0 && (
                <span className="text-sm text-muted-foreground">({safeReviews.length})</span>
              )}
            </div>
            {ratingValue > 0 && (
              <StarRatingDisplay rating={ratingValue} size="sm" showValue />
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : safeReviews.length === 0 ? (
            <div className="rounded-xl bg-muted/30 py-8 text-center">
              <Star className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No reviews yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Reviews appear here after completed SaskHandy jobs.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {safeReviews.map((review) => {
                const reviewName = review.reviewerName?.trim() || "User";
                const reviewInitial = reviewName.charAt(0).toUpperCase() || "U";

                let formattedDate = "";
                try {
                  formattedDate = format(new Date(review.createdAt), "MMM d, yyyy");
                } catch {
                  formattedDate = "";
                }

                return (
                  <div
                    key={review.id}
                    className="border-b border-border/40 last:border-0 pb-5 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {reviewInitial}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">
                          {reviewName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StarRatingDisplay rating={review.rating} size="sm" />
                        {formattedDate && (
                          <span className="text-xs text-muted-foreground">{formattedDate}</span>
                        )}
                      </div>
                    </div>

                    {review.comment?.trim() && (
                      <p className="text-sm text-muted-foreground ml-9 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex justify-center pb-2">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setReportOpen(true)}
          >
            <Flag className="w-4 h-4 mr-2" />
            Report a concern about this profile
          </Button>
        </div>

        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report this profile</DialogTitle>
              <DialogDescription>
                Tell us what concerns you. Reports are reviewed by the SaskHandy team.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="report-reason" className="text-sm font-medium">
                  Reason
                </label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(event) =>
                    setReportReason(event.target.value as typeof reportReason)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="unsafe">Unsafe behaviour</option>
                  <option value="suspicious_profile">Suspicious profile</option>
                  <option value="false_information">False information</option>
                  <option value="off_platform_payment">Off-platform payment request</option>
                  <option value="other">Other concern</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="report-details" className="text-sm font-medium">
                  Details <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  id="report-details"
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Describe what happened or what looks concerning..."
                />
                <p className="text-right text-xs text-muted-foreground">
                  {reportDetails.length}/1000
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReportOpen(false)}
                disabled={createReport.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  createReport.mutate({
                    reportedUserId: uid,
                    reason: reportReason,
                    details: reportDetails.trim() || undefined,
                  })
                }
                disabled={createReport.isPending || uid <= 0}
              >
                {createReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
