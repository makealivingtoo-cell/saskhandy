import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Briefcase, CheckCircle, Loader2, Shield, Star } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "wouter";

export default function PublicProfile() {
  const { userId } = useParams();
  const uid = Number.parseInt(userId ?? "0", 10);

  const { data: profile, isLoading: profileLoading } = trpc.handymanProfiles.getById.useQuery(
    { userId: uid },
    { enabled: uid > 0 }
  );

  const { data: reviews, isLoading: reviewsLoading } = trpc.reviews.getForUser.useQuery(
    { userId: uid },
    { enabled: uid > 0 }
  );

  const categories = useMemo<string[]>(() => {
    if (!profile?.categories) return [];

    try {
      const parsed = JSON.parse(profile.categories);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }, [profile?.categories]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    let score = 0;
    if (profile.bio?.trim()) score += 20;
    if (categories.length > 0) score += 20;
    if (profile.hourlyRate) score += 20;
    if (profile.insuranceCertUrl) score += 20;
    if (profile.insuranceVerified) score += 20;

    return score;
  }, [
    profile,
    categories.length,
  ]);

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
  const displayInitial = displayName.charAt(0).toUpperCase() || "H";
  const ratingValue = profile.rating ? Number.parseFloat(profile.rating) : 0;
  const hourlyRateValue = profile.hourlyRate ? Number.parseFloat(profile.hourlyRate) : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">{displayInitial}</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-serif text-foreground">{displayName}</h1>

                {profile.insuranceVerified && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Insurance Verified
                  </span>
                )}

                {profile.verified && !profile.insuranceVerified && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-3 flex-wrap">
                {ratingValue > 0 ? (
                  <StarRatingDisplay rating={ratingValue} showValue />
                ) : (
                  <span className="text-sm text-muted-foreground">No ratings yet</span>
                )}

                <span className="text-sm text-muted-foreground">
                  <Briefcase className="w-3.5 h-3.5 inline mr-1" />
                  {profile.totalJobs ?? 0} jobs completed
                </span>
              </div>

              {hourlyRateValue !== null && !Number.isNaN(hourlyRateValue) && (
                <p className="text-sm font-medium text-foreground">
                  ${hourlyRateValue.toFixed(0)}/hr
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-border/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Profile completion</p>
              <p className="text-xs font-semibold text-foreground">{profileCompletion}%</p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>

          {profile.bio?.trim() && (
            <div className="mt-5 pt-5 border-t border-border/40">
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {categories.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Services</p>
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

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-foreground">Reviews</h2>
            {safeReviews.length > 0 && (
              <span className="text-sm text-muted-foreground">({safeReviews.length})</span>
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : safeReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No reviews yet.</p>
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {reviewInitial}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{reviewName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StarRatingDisplay rating={review.rating} size="sm" />
                        {formattedDate && (
                          <span className="text-xs text-muted-foreground">{formattedDate}</span>
                        )}
                      </div>
                    </div>

                    {review.comment?.trim() && (
                      <p className="text-sm text-muted-foreground ml-9">{review.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}