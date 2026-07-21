import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { JobChat } from "@/components/JobChat";
import MapView from "@/components/Map";
import { StarRatingDisplay, StarRatingInput } from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Shield,
  Star,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

const bidTips = [
  "Give a clear price based on the job details.",
  "Mention when you are available.",
  "Write a short note showing you understand the work.",
  "Invite the homeowner to message you before choosing if they have questions.",
];

function parseProfileCategories(value?: string | string[] | null): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function getProfileIdentityChecked(profile: any | null | undefined) {
  return (
    profile?.identityVerificationStatus === "approved" ||
    profile?.identityChecked === true ||
    profile?.idNameMatched === true
  );
}

function getProfileCompletionStatus(user: any, profile: any) {
  const categories = parseProfileCategories(profile?.categories);
  const missingFields: string[] = [];

  if (!user?.name || user.name.trim().length < 2) {
    missingFields.push("full name");
  }

  if (!profile?.profileImageUrl) {
    missingFields.push("profile photo");
  }

  if (!profile?.bio || profile.bio.trim().length < 25) {
    missingFields.push("short bio");
  }

  if (categories.length < 1) {
    missingFields.push("skills");
  }

  if (!getProfileIdentityChecked(profile)) {
    missingFields.push("ID name match approval");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    categories,
  };
}

export default function HandymanJobDetails() {
  const { id } = useParams();
  const jobId = parseInt(id ?? "0");
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [availability, setAvailability] = useState("");
  const [showBidForm, setShowBidForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: job, isLoading } = trpc.jobs.getById.useQuery(
    { jobId },
    { enabled: !!jobId }
  );

  const { data: bidSummary } = trpc.bids.getForJobSummary.useQuery(
    { jobId },
    {
      enabled:
        !!jobId &&
        !!isAuthenticated &&
        !!user &&
        (user.userType === "handyman" || user.role === "admin"),
    }
  );

  const { data: handymanProfile, isLoading: profileLoading } = trpc.handymanProfiles.get.useQuery(
    undefined,
    {
      enabled:
        !!isAuthenticated &&
        !!user &&
        (user.userType === "handyman" || user.role === "admin"),
    }
  );

  const bids = bidSummary?.visibleBids ?? [];
  const hiddenBidCount = bidSummary?.hiddenBidCount ?? 0;
  const totalBidCount = bidSummary?.totalBidCount ?? 0;

  const isAssignedHandyman = job?.selectedHandymanId === user?.id;

  const { data: dispute } = trpc.disputes.getByJob.useQuery(
    { jobId },
    { enabled: !!jobId && !!job && job.status === "disputed" && !!isAssignedHandyman }
  );

  const { data: myReview } = trpc.reviews.getMyReview.useQuery(
    { jobId },
    { enabled: !!jobId && !!job && job.status === "completed" && !!isAssignedHandyman }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "handyman" && user?.role !== "admin") {
      navigate("/role-select");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const myBid = bids?.find((b) => b.handymanId === user?.id);

  const createBid = trpc.bids.create.useMutation({
    onSuccess: async () => {
      toast.success("Bid placed. The homeowner can now review it and message you.");
      setShowBidForm(false);
      setBidAmount("");
      setBidMessage("");
      setAvailability("");
      await utils.bids.getForJobSummary.invalidate({ jobId });
      await utils.bids.getForHandyman.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createDispute = trpc.disputes.create.useMutation({
    onSuccess: async () => {
      toast.success("Dispute opened.");
      setShowDisputeForm(false);
      await utils.jobs.getById.invalidate({ jobId });
      await utils.disputes.getByJob.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: async () => {
      toast.success("Review submitted.");
      setShowReviewForm(false);
      await utils.reviews.getMyReview.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Job not found.</p>
        </div>
      </AppLayout>
    );
  }

  const parsedBidAmount = parseFloat(bidAmount);
  const estimatedPayout =
    bidAmount && !Number.isNaN(parsedBidAmount) ? (parsedBidAmount * 0.8).toFixed(2) : null;

  const profileStatus = getProfileCompletionStatus(user, handymanProfile);
  const canPlaceBid = user?.role === "admin" || profileStatus.isComplete;
  const identityApproved = getProfileIdentityChecked(handymanProfile);
  const goldShieldVerified =
    identityApproved && handymanProfile?.criminalRecordCheckStatus === "reviewed";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Link href="/handyman/browse">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </div>
        </Link>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-serif text-foreground">{job.title}</h1>
                <StatusBadge status={job.status} />
              </div>

              {job.homeownerName && (
                <p className="text-xs text-muted-foreground">Posted by {job.homeownerName}</p>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{job.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/40">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Category</p>
              <p className="text-sm font-medium">{job.category}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Location</p>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <p className="text-sm font-medium truncate">{job.location}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Budget</p>
              <p className="text-sm font-medium">${job.budgetMin}–${job.budgetMax}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Posted</p>
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 mb-6">
          <MapView locationQuery={job.location} title="Job Location" heightClassName="h-[280px]" />
        </div>

        {job.status === "open" && !myBid && !profileLoading && !canPlaceBid && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  Complete your profile before sending bids
                </p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  To protect homeowner trust, SaskHandy now requires a clear photo, short bio,
                  listed skills, and approved ID Name Matched status before bidding. Complete these
                  items first:
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {profileStatus.missingFields.map((field) => (
                    <span
                      key={field}
                      className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800"
                    >
                      {field}
                    </span>
                  ))}
                </div>

                <Button asChild size="sm" className="mt-4 bg-amber-700 hover:bg-amber-800">
                  <Link href="/handyman/profile">Complete Profile</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {job.status === "open" && !myBid && canPlaceBid && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  {goldShieldVerified ? "Gold Shield profile" : "ID Name Matched"}
                </p>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Your profile meets SaskHandy’s bid-ready requirements. Homeowners will be able to
                  review your photo, bio, skills, ID badge, and message before choosing.
                </p>
              </div>
            </div>
          </div>
        )}

        {job.status === "open" && !myBid && canPlaceBid && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">Submit a strong bid</p>
                <div className="mt-2 space-y-2">
                  {bidTips.map((tip) => (
                    <div key={tip} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {job.status === "open" && totalBidCount > 0 && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-semibold text-foreground text-sm">Bid Activity</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalBidCount} bid{totalBidCount === 1 ? "" : "s"} submitted for this job.
                </p>
              </div>

              <div className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                Bidding active
              </div>
            </div>

            {hiddenBidCount > 0 ? (
              <div className="space-y-2">
                {Array.from({ length: Math.min(hiddenBidCount, 3) }).map((_, index) => (
                  <div
                    key={`hidden-bid-${index}`}
                    className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="h-3 w-24 rounded-full bg-muted-foreground/20 blur-[1px]" />
                        <div className="h-2.5 w-40 rounded-full bg-muted-foreground/10 blur-[1px] mt-2" />
                      </div>

                      <div className="h-4 w-16 rounded-full bg-muted-foreground/20 blur-[1px]" />
                    </div>
                  </div>
                ))}

                {hiddenBidCount > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{hiddenBidCount - 3} more hidden bid{hiddenBidCount - 3 === 1 ? "" : "s"}
                  </p>
                )}

                <div className="pt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <p>
                    Other bid details are hidden to keep pricing fair. Submit your best price based
                    on the job details, not other handymen’s bids.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                You can see the bid details relevant to your account.
              </p>
            )}
          </div>
        )}

        {myBid && (
          <div
            className={`rounded-xl border p-5 mb-6 ${
              myBid.status === "accepted"
                ? "bg-emerald-50 border-emerald-200"
                : myBid.status === "rejected"
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">Your Bid</p>
                  <StatusBadge status={myBid.status} />
                </div>

                {myBid.message && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{myBid.message}</p>
                )}

                {myBid.availability && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Availability: {myBid.availability}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-xl font-bold">${myBid.bidAmount}</p>
                <p className="text-xs text-muted-foreground">
                  You keep ${(parseFloat(myBid.bidAmount) * 0.8).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/5 flex items-start gap-2 text-xs text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p>
                SaskHandy keeps a 20% platform fee. Your payout is 80% of the accepted bid after the
                job is completed and released.
              </p>
            </div>

            {job.status === "open" && myBid.status === "pending" && (
              <div className="mt-4 pt-4 border-t border-black/5">
                <div className="bg-white/60 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Waiting for homeowner response
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        The homeowner can message you here before accepting your bid. Keep the
                        conversation on SaskHandy so the job details and payment process stay
                        protected.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {job.status === "open" && myBid && myBid.status === "pending" && (
          <JobChat
            jobId={jobId}
            bidId={myBid.id}
            otherPartyLabel={job.homeownerName ?? "the homeowner"}
            title="Bid Chat"
            description="Message the homeowner about your bid before they decide whether to accept."
          />
        )}

        {job.status === "open" && !myBid && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            {!showBidForm ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground text-sm">Interested in this job?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {canPlaceBid
                      ? "Send a clear bid with your price, availability, and short message."
                      : "Complete your bid-ready profile first, including ID Name Matched approval, so homeowners can review who they are hiring."}
                  </p>
                </div>

                {canPlaceBid ? (
                  <Button onClick={() => setShowBidForm(true)}>Place a Bid</Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/handyman/profile">Complete Profile</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-foreground">Place Your Bid</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    The homeowner will see your price, message, availability, and profile details.
                  </p>

                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed text-emerald-800">
                        Keep your bid professional and keep communication on SaskHandy. Homeowners
                        can review your ID Name Matched status and message you before choosing, so
                        use your note to build confidence.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bidAmount">Bid Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="bidAmount"
                      type="number"
                      min="1"
                      step="10"
                      placeholder="Enter your bid"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>

                  {estimatedPayout && (
                    <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                      <DollarSign className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <p>
                        You&apos;ll receive <strong>${estimatedPayout}</strong> after SaskHandy’s
                        20% platform fee.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    placeholder="e.g., Available this weekend or weekday evenings"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Message to Homeowner</Label>
                  <Textarea
                    id="message"
                    placeholder="Briefly explain how you can help, when you can do it, and why you're a good fit."
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="bg-muted/40 border border-border/50 rounded-xl p-4">
                  <p className="text-xs font-medium text-foreground mb-2">Before submitting:</p>
                  <div className="space-y-1.5">
                    {bidTips.map((tip) => (
                      <div key={`check-${tip}`} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!canPlaceBid) {
                        toast.error("Complete your bid-ready profile, including ID Name Matched approval, before sending bids.");
                        return;
                      }

                      createBid.mutate({
                        jobId,
                        bidAmount: parseFloat(bidAmount),
                        message: bidMessage || undefined,
                        availability: availability || undefined,
                      });
                    }}
                    disabled={
                      !canPlaceBid || !bidAmount || parseFloat(bidAmount) <= 0 || createBid.isPending
                    }
                    className="flex-1"
                  >
                    {createBid.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Submit Bid
                  </Button>

                  <Button variant="outline" onClick={() => setShowBidForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isAssignedHandyman && job.status === "in_progress" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-950">
                  Confirm the job time with the homeowner
                </p>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Payment has been completed. Message {job.homeownerName ?? "the homeowner"} to
                  confirm your arrival time, next availability, and any details you need before
                  starting the job.
                </p>
                <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
                  Clear updates help avoid cancellations, refunds, and account review.
                </p>
              </div>
            </div>
          </div>
        )}

        {isAssignedHandyman && job.status !== "cancelled" && (
          <JobChat
            jobId={jobId}
            bidId={job.selectedBidId ?? undefined}
            includeJobThread
            paymentPending={job.status === "awaiting_payment"}
            otherPartyLabel={job.homeownerName ?? "the homeowner"}
            description={
              job.status === "awaiting_payment"
                ? "Message the homeowner while payment is being completed."
                : undefined
            }
          />
        )}

        {isAssignedHandyman && job.status === "in_progress" && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            {!showDisputeForm ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground text-sm">Issue with this job?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Open a dispute only if there is a serious issue that cannot be resolved with the
                    homeowner.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/5"
                  onClick={() => setShowDisputeForm(true)}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                  Open Dispute
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-red-800">Open a Dispute</h3>

                <Textarea
                  placeholder="Describe the issue..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => createDispute.mutate({ jobId, reason: disputeReason })}
                    disabled={disputeReason.length < 10 || createDispute.isPending}
                  >
                    {createDispute.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    Submit Dispute
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => setShowDisputeForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {dispute && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold text-red-800">Dispute Open</h3>
              <StatusBadge status={dispute.status} />
            </div>

            <p className="text-sm text-red-700">{dispute.reason}</p>

            {dispute.adminNotes && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs font-medium text-red-800">Admin Resolution:</p>
                <p className="text-sm text-red-700 mt-1">{dispute.adminNotes}</p>
              </div>
            )}
          </div>
        )}

        {job.status === "completed" && isAssignedHandyman && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-foreground">Rate the Homeowner</h3>
            </div>

            {myReview ? (
              <div className="flex items-center gap-3">
                <StarRatingDisplay rating={myReview.rating} showValue />
                <p className="text-sm text-muted-foreground">{myReview.comment}</p>
              </div>
            ) : showReviewForm ? (
              <div className="space-y-3">
                <StarRatingInput value={reviewRating} onChange={setReviewRating} />

                <Textarea
                  placeholder="Share your experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      createReview.mutate({
                        jobId,
                        revieweeId: job.homeownerId,
                        rating: reviewRating,
                        comment: reviewComment,
                      })
                    }
                    disabled={reviewRating === 0 || createReview.isPending}
                  >
                    {createReview.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    Submit Review
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  Leave a review to help build trust on SaskHandy.
                </p>

                <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)}>
                  <Star className="w-3.5 h-3.5 mr-1.5" />
                  Leave a Review
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
