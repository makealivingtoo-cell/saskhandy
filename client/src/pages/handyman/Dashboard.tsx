import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, DollarSign, Loader2, Search, Shield, Star, TrendingUp } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border/60 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-primary font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function HandymanDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.handymanProfiles.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myBids, isLoading: bidsLoading } = trpc.bids.getForHandyman.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: earnings } = trpc.payments.getHandymanEarnings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "handyman" && user?.role !== "admin") {
      navigate("/role-select");
      return;
    }

    if (!loading && isAuthenticated && user?.userType === "handyman" && !profileLoading && !profile) {
      navigate("/onboarding");
    }
  }, [loading, isAuthenticated, user, profileLoading, profile, navigate]);

  const pendingBids = myBids?.filter((b) => b.status === "pending") ?? [];
  const acceptedBids = myBids?.filter((b) => b.status === "accepted") ?? [];

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    let categories: string[] = [];
    try {
      categories = JSON.parse(profile.categories ?? "[]");
    } catch {}

    let score = 0;
    if (profile.bio?.trim()) score += 20;
    if (categories.length > 0) score += 20;
    if (profile.hourlyRate) score += 20;
    if (profile.insuranceCertUrl) score += 20;
    if (profile.insuranceVerified) score += 20;

    return score;
  }, [profile]);

  if (loading || profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-foreground">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {profile?.rating && parseFloat(profile.rating) > 0 ? (
              <StarRatingDisplay rating={parseFloat(profile.rating)} size="sm" showValue />
            ) : (
              <span className="text-sm text-muted-foreground">No ratings yet</span>
            )}

            <span className="text-sm text-muted-foreground">
              {profile?.totalJobs ?? 0} jobs completed
            </span>

            {profile?.insuranceVerified ? (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Insurance Verified
              </span>
            ) : profile?.verified ? (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                Verified
              </span>
            ) : null}
          </div>
        </div>

        <Button asChild>
          <Link href="/handyman/browse">
            <Search className="w-4 h-4 mr-2" />
            Browse Jobs
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Profile completion</p>
          <p className="text-sm font-semibold text-foreground">{profileCompletion}%</p>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          A more complete profile makes homeowners more likely to trust your bids.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Earned"
          value={`$${parseFloat(earnings?.totalEarnings ?? "0").toFixed(0)}`}
          icon={DollarSign}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Active Bids"
          value={pendingBids.length}
          icon={Briefcase}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Jobs Won"
          value={acceptedBids.length}
          icon={TrendingUp}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Rating"
          value={profile?.rating ? parseFloat(profile.rating).toFixed(1) : "—"}
          icon={Star}
          color="bg-purple-50 text-purple-600"
          sub={profile?.totalJobs ? `${profile.totalJobs} jobs completed` : undefined}
        />
      </div>

      {profileCompletion < 100 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-amber-800">Complete your profile</p>
            <p className="text-xs text-amber-700">
              Add missing details to increase trust and improve your chances of winning bids.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            <Link href="/handyman/profile">Update Profile</Link>
          </Button>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Recent Bids</h2>
          <Link href="/handyman/bids">
            <span className="text-sm text-primary hover:underline cursor-pointer">View all</span>
          </Link>
        </div>

        {bidsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !myBids || myBids.length === 0 ? (
          <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">No bids yet</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Browse available jobs and start placing competitive bids.
            </p>
            <Button asChild>
              <Link href="/handyman/browse">
                <Search className="w-4 h-4 mr-2" />
                Browse Jobs
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myBids.slice(0, 5).map((bid) => (
              <Link key={bid.id} href={`/handyman/jobs/${bid.jobId}`}>
                <div className="bg-white rounded-xl border border-border/60 p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-foreground text-sm truncate">
                          {bid.jobTitle ?? "Job"}
                        </p>
                        <StatusBadge status={bid.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {bid.jobLocation && <span>{bid.jobLocation}</span>}
                        <span>{formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">${bid.bidAmount}</p>
                      <p className="text-xs text-muted-foreground">your bid</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}