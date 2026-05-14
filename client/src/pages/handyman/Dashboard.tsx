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
  ExternalLink,
  Lightbulb,
  Loader2,
  MapPin,
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
  "ID, insurance, criminal check, and licence badges can make your bid stand out when homeowners are unsure.",
  "Check open jobs regularly. Being early can help your bid get noticed.",
];

const bidTips = [
  "Mention when you are available.",
  "Explain briefly how you would handle the job.",
  "Keep your price clear and realistic.",
  "Use a professional tone, even for small jobs.",
  "Invite the homeowner to message you if they have questions before choosing.",
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

function getProfileCategories(profile: any) {
  try {
    const parsed = JSON.parse(profile?.categories ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function getBidReadyItems(profile: any, fullName?: string | null) {
  const categories = getProfileCategories(profile);

  return [
    {
      label: "Full name",
      completed: Boolean(fullName && fullName.trim().length >= 2),
      required: true,
    },
    {
      label: "Profile photo",
      completed: Boolean(profile?.profileImageUrl),
      required: true,
    },
    {
      label: "Short bio",
      completed: Boolean(profile?.bio?.trim() && profile.bio.trim().length >= 25),
      required: true,
    },
    {
      label: "Skills/services",
      completed: categories.length > 0,
      required: true,
    },
    {
      label: "ID name matched",
      completed: profile?.identityVerificationStatus === "approved",
      required: true,
    },
  ];
}

function getTrustBoosterItems(profile: any) {
  const hasExternalReviewLink = Boolean(
    profile?.externalGoogleReviewsUrl ||
      profile?.externalFacebookReviewsUrl ||
      profile?.externalWebsiteUrl
  );

  return [
    {
      label: "Service area",
      completed: Boolean(profile?.serviceArea?.trim()),
    },
    {
      label: "Hourly rate",
      completed: Boolean(profile?.hourlyRate),
    },
    {
      label: "External reviews linked",
      completed: hasExternalReviewLink,
    },
    {
      label: "ID name matched",
      completed: profile?.identityVerificationStatus === "approved",
    },
    {
      label: "Insurance reviewed",
      completed: Boolean(profile?.insuranceVerified),
    },
    {
      label: "Criminal check reviewed",
      completed: profile?.criminalRecordCheckStatus === "reviewed",
    },
    {
      label: "Trade licence verified",
      completed: profile?.tradeLicenseVerificationStatus === "approved",
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

  const bidReadyItems = useMemo(() => getBidReadyItems(profile, user?.name), [profile, user?.name]);
  const trustBoosterItems = useMemo(() => getTrustBoosterItems(profile), [profile]);

  const bidReadyCompletion = useMemo(() => {
    if (!profile) return 0;

    const completedItems = bidReadyItems.filter((item) => item.completed).length;
    return Math.round((completedItems / bidReadyItems.length) * 100);
  }, [profile, bidReadyItems]);

  const isBidReady = bidReadyItems.every((item) => item.completed);
  const completedTrustBoosters = trustBoosterItems.filter((item) => item.completed).length;
  const goldShieldVerified =
    profile?.identityVerificationStatus === "approved" &&
    profile?.criminalRecordCheckStatus === "reviewed";
  const hasExternalReviewLinks = Boolean(
    profile?.externalGoogleReviewsUrl ||
      profile?.externalFacebookReviewsUrl ||
      profile?.externalWebsiteUrl
  );

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

              {goldShieldVerified && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Gold Shield
                </span>
              )}

              {profile?.identityVerificationStatus === "approved" && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  ID Name Matched
                </span>
              )}

              {profile?.insuranceVerified && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Insurance Reviewed
                </span>
              )}

              {profile?.criminalRecordCheckStatus === "reviewed" && (
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Criminal Check Reviewed
                </span>
              )}

              {profile?.tradeLicenseVerificationStatus === "approved" && (
                <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Licence Verified
                </span>
              )}
            </div>

            {profile?.serviceArea && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile.serviceArea}</span>
              </div>
            )}

            {hasExternalReviewLinks && (
              <div className="flex items-center gap-2 text-xs mt-2 flex-wrap">
                <span className="text-muted-foreground">External reviews:</span>

                {profile?.externalGoogleReviewsUrl && (
                  <a
                    href={profile.externalGoogleReviewsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Google <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {profile?.externalFacebookReviewsUrl && (
                  <a
                    href={profile.externalFacebookReviewsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Facebook <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {profile?.externalWebsiteUrl && (
                  <a
                    href={profile.externalWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
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

        {!isBidReady && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-950">
                Safety First: ID approval required before bidding
              </p>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                To protect homeowner trust, SaskHandy now requires ID Name Matched approval before
                handymen can send bids. Complete your profile and submit your ID on the profile page.
              </p>

              <Button asChild size="sm" variant="outline" className="mt-3 bg-white">
                <Link href="/handyman/profile">Complete Verification</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-border/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Bid-ready profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                These required details, including ID Name Matched approval, must be complete before you can send bids.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-sm font-semibold text-foreground">{bidReadyCompletion}%</p>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  isBidReady ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {isBidReady ? "Ready to bid" : "Required before bidding"}
              </p>
            </div>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all ${
                isBidReady ? "bg-emerald-600" : "bg-amber-500"
              }`}
              style={{ width: `${bidReadyCompletion}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {bidReadyItems.map((item) => (
              <span
                key={item.label}
                className={`text-xs px-3 py-1 rounded-full border ${
                  item.completed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {item.completed ? "✓ " : ""}
                {item.label}
              </span>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-medium text-foreground">Trust boosters</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Local details and verification signals that can help homeowners feel more confident.
                </p>
              </div>

              <p className="text-xs font-medium text-primary">
                {completedTrustBoosters}/{trustBoosterItems.length} complete
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {trustBoosterItems.map((item) => (
                <span
                  key={item.label}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    item.completed
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-muted text-muted-foreground border-border/60"
                  }`}
                >
                  {item.completed ? "✓ " : ""}
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {!isBidReady && (
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Complete the required items so homeowners can review your profile before you bid.
              </p>

              <Button asChild size="sm" variant="outline">
                <Link href="/handyman/profile">Complete Profile</Link>
              </Button>
            </div>
          )}

          {isBidReady && completedTrustBoosters < trustBoosterItems.length && (
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Add service area, external reviews, insurance, criminal check, or licence verification to improve homeowner trust.
              </p>

              <Button asChild size="sm" variant="outline">
                <Link href="/handyman/profile">Add Trust Signals</Link>
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
                "Complete your bid-ready profile, including ID Name Matched approval.",
                "Browse open jobs that match your skills.",
                "Send a clear bid with price, availability, and a short message.",
                "Reply quickly if the homeowner messages you before choosing.",
                "If accepted, complete the job and request payout after completion.",
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