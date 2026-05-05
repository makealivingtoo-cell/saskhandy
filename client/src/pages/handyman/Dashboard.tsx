import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  CheckCircle,
  DollarSign,
  Lightbulb,
  Loader2,
  Search,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";
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

const handymanNotes = [
  "A clear bid with a fair price and availability can stand out more than the cheapest offer.",
  "Homeowners trust details. A short, specific message can help your bid feel more professional.",
  "Small jobs can lead to repeat work when you communicate clearly and show up reliably.",
  "A complete profile helps homeowners feel safer choosing you for the job.",
  "Check open jobs regularly. Being early can help your bid get noticed.",
];

const bidTips = [
  "Mention when you are available.",
  "Explain briefly how you would handle the job.",
  "Keep your price clear and realistic.",
  "Use a professional tone, even for small jobs.",
];

function getDailyNote(name?: string | null) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const seed = `${todayKey}-${name ?? "handyman"}`;

  let total = 0;
  for (let i = 0; i < seed.length; i += 1) {
    total += seed.charCodeAt(i);
  }

  return handymanNotes[total % handymanNotes.length];
}

function getProfileItems(profile: any) {
  let categories: string[] = [];

  try {
    categories = JSON.parse(profile?.categories ?? "[]");
  } catch {
    categories = [];
  }

  return [
    {
      label: "Bio",
      completed: Boolean(profile?.bio?.trim()),
    },
    {
      label: "Skills",
      completed: categories.length > 0,
    },
    {
      label: "Hourly rate",
      completed: Boolean(profile?.hourlyRate),
    },
    {
      label: "Insurance document",
      completed: Boolean(profile?.insuranceCertUrl),
    },
    {
      label: "Insurance verified",
      completed: Boolean(profile?.insuranceVerified),
    },
  ];
}

export default function HandymanDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.handymanProfiles.get.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

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

    if (
      !loading &&
      isAuthenticated &&
      user?.userType === "handyman" &&
      !profileLoading &&
      !profile
    ) {
      navigate("/onboarding");
    }
  }, [loading, isAuthenticated, user, profileLoading, profile, navigate]);

  const pendingBids = myBids?.filter((b) => b.status === "pending") ?? [];
  const acceptedBids = myBids?.filter((b) => b.status === "accepted") ?? [];

  const profileItems = useMemo(() => getProfileItems(profile), [profile]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    const completedItems = profileItems.filter((item) => item.completed).length;
    return Math.round((completedItems / profileItems.length) * 100);
  }, [profile, profileItems]);

  const dailyNote = useMemo(() => getDailyNote(user?.name), [user?.name]);

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
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
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

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Today’s handyman note</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{dailyNote}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Profile completion</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A complete profile helps homeowners trust your bids.
              </p>
            </div>

            <p className="text-sm font-semibold text-foreground">{profileCompletion}%</p>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {profileItems.map((item) => (
              <span
                key={item.label}
                className={`text-xs px-3 py-1 rounded-full border ${
                  item.completed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-muted text-muted-foreground border-border/60"
                }`}
              >
                {item.completed ? "✓ " : ""}
                {item.label}
              </span>
            ))}
          </div>

          {profileCompletion < 100 && (
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Add missing details to make your profile look more reliable to homeowners.
              </p>

              <Button asChild size="sm" variant="outline">
                <Link href="/handyman/profile">Update Profile</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Available Balance"
            value={`$${parseFloat(earnings?.availableBalance ?? "0").toFixed(0)}`}
            icon={DollarSign}
            color="bg-emerald-50 text-emerald-600"
            sub="ready to request"
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

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-border/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">What happens next?</h2>
            </div>

            <div className="space-y-3">
              {[
                "Browse open jobs that match your skills.",
                "Send a clear bid with price, availability, and a short message.",
                "If accepted, complete the job and communicate through SaskHandy.",
                "After completion, your earnings become available for payout request.",
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Win more jobs</h2>
            </div>

            <div className="space-y-3">
              {bidTips.map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recent Bids</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track the bids you have sent and follow up on accepted jobs.
              </p>
            </div>

            <Link href="/handyman/bids">
              <span className="text-sm text-primary hover:underline cursor-pointer">View all</span>
            </Link>
          </div>

          {bidsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !myBids || myBids.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border/60 p-8 sm:p-10 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />

              <h3 className="font-semibold text-foreground mb-2">No bids sent yet</h3>

              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto leading-relaxed">
                Browse available jobs and send a clear bid with your price, availability, and a
                short note about how you can help.
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

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {bid.jobLocation && <span>{bid.jobLocation}</span>}
                          <span>
                            {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                          </span>
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
      </div>
    </AppLayout>
  );
}