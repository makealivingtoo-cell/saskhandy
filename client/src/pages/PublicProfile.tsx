import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Briefcase, CheckCircle, Loader2, Shield, Star, User } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "wouter";

function ProfileAvatar({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name: string;
}) {
  const displayInitial = name.charAt(0).toUpperCase() || "H";

  return (
    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-border/60">
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
    if (profile.profileImageUrl) score += 20;
    if (profile.bio?.trim()) score += 20;
    if (categories.length > 0) score += 20;
    if (profile.hourlyRate) score += 15;
    if (profile.insuranceCertUrl) score += 10;
    if (profile.insuranceVerified) score += 15;

    return Math.min(score, 100);
  }, [profile, categories.length]);

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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <ProfileAvatar imageUrl={profile.profileImageUrl} name={displayName} />

            <div className="flex-1 min-w-0">
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

              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Review this handyman’s services, experience, rating, and trust details before
                accepting a bid.
              </p>
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

          {profile.insuranceVerified && (
            <div className="mt-5 pt-5 border-t border-border/40">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Insurance verified</p>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    This handyman uploaded an insurance document that was reviewed and approved by
                    admin.
                  </p>
                </div>
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
            <div className="text-center py-6">
              <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No reviews yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Reviews will appear here after completed jobs.
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