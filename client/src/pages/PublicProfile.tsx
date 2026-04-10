import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Briefcase, Loader2, MapPin, Shield, Star } from "lucide-react";
import { useParams } from "wouter";

export default function PublicProfile() {
  const { userId } = useParams();
  const uid = parseInt(userId ?? "0");

  const { data: profile, isLoading: profileLoading } = trpc.handymanProfiles.getById.useQuery(
    { userId: uid },
    { enabled: !!uid }
  );
  const { data: reviews, isLoading: reviewsLoading } = trpc.reviews.getForUser.useQuery(
    { userId: uid },
    { enabled: !!uid }
  );

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

  let categories: string[] = [];
  try { categories = JSON.parse(profile.categories ?? "[]"); } catch {}

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">
                {profile.userName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-serif text-foreground">{profile.userName}</h1>
                {profile.verified && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-3">
                {profile.rating && parseFloat(profile.rating) > 0 ? (
                  <StarRatingDisplay rating={parseFloat(profile.rating)} showValue />
                ) : (
                  <span className="text-sm text-muted-foreground">No ratings yet</span>
                )}
                <span className="text-sm text-muted-foreground">
                  <Briefcase className="w-3.5 h-3.5 inline mr-1" />
                  {profile.totalJobs ?? 0} jobs completed
                </span>
              </div>

              {profile.hourlyRate && (
                <p className="text-sm font-medium text-foreground">
                  ${parseFloat(profile.hourlyRate).toFixed(0)}/hr
                </p>
              )}
            </div>
          </div>

          {profile.bio && (
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

        {/* Reviews */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-foreground">Reviews</h2>
            {reviews && reviews.length > 0 && (
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !reviews || reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No reviews yet.</p>
          ) : (
            <div className="space-y-5">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border/40 last:border-0 pb-5 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {review.reviewerName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{review.reviewerName ?? "User"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRatingDisplay rating={review.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground ml-9">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
