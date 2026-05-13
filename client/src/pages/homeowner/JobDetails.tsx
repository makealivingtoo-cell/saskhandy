import { useAuth } from "@/_core/hooks/useAuth";
import { StripePaymentModal } from "@/components/StripePaymentModal";
import { JobChat } from "@/components/JobChat";
import { AppLayout } from "@/components/AppLayout";
import MapView from "@/components/Map";
import { StarRatingDisplay, StarRatingInput } from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Flag,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Shield,
  Star,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useMemo, useState } from "react";

const cancellationReasons = [
  {
    value: "dont_trust_profile",
    label: "I don’t trust the handyman/profile",
  },
  {
    value: "bids_too_expensive",
    label: "Bids were too expensive",
  },
  {
    value: "no_longer_needed",
    label: "I no longer need the job done",
  },
  {
    value: "hired_outside_saskhandy",
    label: "I hired someone outside SaskHandy",
  },
  {
    value: "not_enough_bidder_info",
    label: "I didn’t get enough information from bidders",
  },
  {
    value: "timing_didnt_work",
    label: "Timing or availability didn’t work",
  },
  {
    value: "other",
    label: "Other",
  },
] as const;

type CancellationReason = (typeof cancellationReasons)[number]["value"];

function getBidInsuranceVerified(bid: any) {
  return bid?.handymanInsuranceVerified === true;
}

function getBidCompletedJobs(bid: any) {
  if (typeof bid?.handymanTotalJobs === "number") return bid.handymanTotalJobs;
  if (typeof bid?.handymanCompletedJobs === "number") return bid.handymanCompletedJobs;
  return 0;
}

function getBidReviewCount(bid: any) {
  if (typeof bid?.handymanReviewCount === "number") return bid.handymanReviewCount;
  if (typeof bid?.handymanTotalReviews === "number") return bid.handymanTotalReviews;
  return 0;
}

function getBidBio(bid: any) {
  return bid?.handymanBio ?? bid?.handymanProfileBio ?? bid?.bio ?? null;
}

function getBidSkills(bid: any): string[] {
  const rawSkills = bid?.handymanSkills ?? bid?.skills ?? bid?.handymanServices ?? [];

  if (Array.isArray(rawSkills)) {
    return rawSkills.filter(Boolean).map(String);
  }

  if (typeof rawSkills === "string") {
    try {
      const parsed = JSON.parse(rawSkills);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      return rawSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getBidIdentityChecked(bid: any) {
  return bid?.handymanIdentityChecked === true || bid?.handymanIdNameMatched === true;
}

function HandymanTrustSummary({ bid, compact = false }: { bid: any; compact?: boolean }) {
  const completedJobs = getBidCompletedJobs(bid);
  const reviewCount = getBidReviewCount(bid);
  const bio = getBidBio(bid);
  const skills = getBidSkills(bid).slice(0, compact ? 3 : 5);
  const hasRating = !!bid?.handymanRating;
  const isNew = completedJobs === 0;
  const hasNoReviews = reviewCount === 0 && !hasRating;

  return (
    <div className={compact ? "mt-2 space-y-2" : "mt-3 space-y-3"}>
      <div className="flex flex-wrap gap-1.5">
        {getBidIdentityChecked(bid) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            <Shield className="h-3 w-3" />
            Identity checked
          </span>
        )}

        {getBidInsuranceVerified(bid) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <Shield className="h-3 w-3" />
            Insurance verified
          </span>
        )}

        {isNew && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            New to SaskHandy
          </span>
        )}

        {hasNoReviews && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            No reviews yet
          </span>
        )}
      </div>

      {bio && (
        <p className={`text-muted-foreground leading-relaxed ${compact ? "text-xs line-clamp-1" : "text-sm"}`}>
          {bio}
        </p>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {hasNoReviews && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          This handyman has not completed a reviewed job on SaskHandy yet. You can message them
          before choosing to ask about their experience, availability, and past work.
        </p>
      )}
    </div>
  );
}

function HandymanAvatar({
  imageUrl,
  name,
  size = "sm",
}: {
  imageUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "md" ? "w-11 h-11" : "w-8 h-8";
  const iconSizeClass = size === "md" ? "w-5 h-5" : "w-4 h-4";
  const initialSizeClass = size === "md" ? "text-base" : "text-sm";

  return (
    <div
      className={`${sizeClass} bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-border/60 shrink-0`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name ?? "Handyman"} profile`}
          className="w-full h-full object-cover"
        />
      ) : name ? (
        <span className={`font-semibold text-primary ${initialSizeClass}`}>
          {name.charAt(0).toUpperCase()}
        </span>
      ) : (
        <User className={`${iconSizeClass} text-primary`} />
      )}
    </div>
  );
}

function BidChatDrawer({
  bid,
  jobId,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onReport,
  acceptPending,
  rejectPending,
}: {
  bid: any | null;
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (bid: any) => void;
  onReject: (bidId: number) => void;
  onReport: (bid: any) => void;
  acceptPending: boolean;
  rejectPending: boolean;
}) {
  if (!isOpen || !bid) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close chat overlay"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-border/60 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <HandymanAvatar
                imageUrl={(bid as any).handymanProfileImageUrl}
                name={bid.handymanName}
                size="md"
              />

              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {bid.handymanName ?? "Handyman"}
                </p>

                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {bid.handymanRating ? (
                    <StarRatingDisplay
                      rating={parseFloat(bid.handymanRating)}
                      size="sm"
                      showValue
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No rating yet</span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {getBidCompletedJobs(bid)} jobs completed
                  </span>
                </div>

                <HandymanTrustSummary bid={bid} compact />
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted shrink-0"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Bid amount</p>
              <p className="text-2xl font-bold text-foreground">${bid.bidAmount}</p>
            </div>

            <Link href={`/profile/${bid.handymanId}`}>
              <span className="text-sm text-primary hover:underline cursor-pointer shrink-0">
                View Profile
              </span>
            </Link>
          </div>

          {bid.message && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {bid.message}
            </p>
          )}

          {bid.availability && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Availability: {bid.availability}
              </span>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">What happens next?</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Choose a handyman, review secure payment, then chat and coordinate the job.
                  Payment is released only after you mark the job complete.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs leading-relaxed text-amber-800">
              Not sure yet? Message the handyman first.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 mt-3">
            <Button onClick={() => onAccept(bid)} disabled={acceptPending}>
              {acceptPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Choose This Handyman
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              You’ll review secure payment on the next step.
            </p>

            <Button
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={() => onReject(bid.id)}
              disabled={rejectPending}
            >
              {rejectPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject Bid
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onReport(bid)}
            >
              <Flag className="w-4 h-4 mr-2" />
              Report a concern
            </Button>
          </div>

          <div className="mt-2 flex items-start gap-2 text-[11px] text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p>Payment is held securely until you mark the job complete.</p>
          </div>
          </div>
        </div>

        <div className="h-[320px] min-h-[300px] max-h-[340px] p-2.5 bg-muted/30 border-t border-border/60 shrink-0">
          <JobChat
            jobId={jobId}
            bidId={bid.id}
            otherPartyLabel={bid.handymanName ?? "this handyman"}
            title="Bid Chat"
            description={`Message ${bid.handymanName ?? "this handyman"} before choosing. Ask about experience, availability, and what they need for the job.`}
            compact
            className="h-full min-h-0 mt-0"
          />
        </div>
      </div>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const jobId = parseInt(id ?? "0");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
  const [paymentBid, setPaymentBid] = useState<any | null>(null);
  const [showCancelReasonForm, setShowCancelReasonForm] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancellationReason | "">("");
  const [cancelDetails, setCancelDetails] = useState("");
  const [reportingBidId, setReportingBidId] = useState<number | null>(null);

  const { data: job, isLoading: jobLoading } = trpc.jobs.getById.useQuery(
    { jobId },
    { enabled: !!jobId }
  );

  const { data: bids, isLoading: bidsLoading } = trpc.bids.getForJob.useQuery(
    { jobId },
    { enabled: !!jobId }
  );

  const { data: payment } = trpc.payments.getByJob.useQuery(
    { jobId },
    { enabled: !!jobId && !!job?.selectedBidId }
  );

  const { data: dispute } = trpc.disputes.getByJob.useQuery(
    { jobId },
    { enabled: !!jobId && job?.status === "disputed" }
  );

  const { data: myReview } = trpc.reviews.getMyReview.useQuery(
    { jobId },
    { enabled: !!jobId && job?.status === "completed" }
  );

  const acceptBid = trpc.bids.accept.useMutation({
    onSuccess: async () => {
      setShowPaymentModal(true);
      setSelectedBidId(null);
      await utils.jobs.getById.invalidate({ jobId });
      await utils.bids.getForJob.invalidate({ jobId });
      await utils.payments.getByJob.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectBid = trpc.bids.reject.useMutation({
    onSuccess: async () => {
      toast.success("Bid rejected.");
      setSelectedBidId(null);
      await utils.bids.getForJob.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  const markComplete = trpc.jobs.updateStatus.useMutation({
    onSuccess: async () => {
      toast.success("Job marked complete. Payment released to handyman.");
      await utils.jobs.getById.invalidate({ jobId });
      await utils.payments.getByJob.invalidate({ jobId });
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

  const deleteJob = trpc.jobs.remove.useMutation({
    onSuccess: async () => {
      toast.success("Job deleted.");
      await utils.jobs.getByHomeowner.invalidate();
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelJob = trpc.jobs.cancel.useMutation({
    onSuccess: async () => {
      toast.success("Job cancelled. Thanks for sharing why — this helps improve SaskHandy.");
      setShowCancelReasonForm(false);
      setCancelReason("");
      setCancelDetails("");
      await utils.jobs.getById.invalidate({ jobId });
      await utils.jobs.getByHomeowner.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createReport = trpc.reports.create.useMutation({
    onSuccess: async () => {
      toast.success("Report submitted. SaskHandy will review this concern.");
      setReportingBidId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const jobPhotos = useMemo(() => {
    if (!job?.photos) return [];
    return Array.isArray(job.photos) ? job.photos : [];
  }, [job?.photos]);

  if (jobLoading) {
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

  const isOwner = job.homeownerId === user?.id;
  const pendingBids = bids?.filter((b) => b.status === "pending") ?? [];
  const acceptedBid = bids?.find((b) => b.status === "accepted");
  const selectedBid = pendingBids.find((bid) => bid.id === selectedBidId) ?? null;
  const modalBid = paymentBid ?? acceptedBid;

  const canEdit = isOwner && job.status === "open" && !job.selectedBidId && !job.selectedHandymanId;
  const canDelete = canEdit && pendingBids.length === 0 && !payment;
  const canCancel = canEdit && pendingBids.length > 0;
  const isAwaitingPayment = job.status === "awaiting_payment";
  const canRetryPayment = isAwaitingPayment && !!acceptedBid;

  const handleAcceptBid = (bid: any) => {
    setPaymentBid(bid);
    acceptBid.mutate({ bidId: bid.id });
  };

  const handleCancelJob = () => {
    if (!cancelReason) {
      toast.error("Please choose a cancellation reason.");
      return;
    }

    cancelJob.mutate({
      jobId,
      reason: cancelReason,
      details: cancelDetails.trim() || undefined,
    });
  };

  const handleReportBid = (bid: any) => {
    setReportingBidId(bid.id);

    createReport.mutate({
      jobId,
      bidId: bid.id,
      reportedUserId: bid.handymanId,
      reason: "unsafe",
      details:
        "Homeowner reported a concern from the bid drawer. Follow up with the homeowner for details.",
    });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </div>
        </Link>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-serif text-foreground">{job.title}</h1>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{job.description}</p>
            </div>
          </div>

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

        {jobPhotos.length > 0 && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Job Photos</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {jobPhotos.map((photoUrl, index) => (
                <a
                  key={`${photoUrl}-${index}`}
                  href={photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl overflow-hidden border border-border/60 bg-muted hover:opacity-95 transition"
                >
                  <img
                    src={photoUrl}
                    alt={`Job photo ${index + 1}`}
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 mb-6">
          <MapView locationQuery={job.location} title="Job Location" heightClassName="h-[280px]" />
        </div>

        {isAwaitingPayment && acceptedBid && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <h3 className="font-semibold text-amber-800">Payment needed to start the job</h3>
            </div>

            <p className="text-sm text-amber-700 mb-4 leading-relaxed">
              You accepted a bid from {acceptedBid.handymanName ?? "this handyman"}. Complete the
              secure payment to officially start the job. The payment is held until you mark the
              work as complete.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setPaymentBid(acceptedBid);
                  setShowPaymentModal(true);
                }}
              >
                Complete Secure Payment
              </Button>

              <p className="text-xs text-amber-700 self-center">
                If your earlier payment attempt failed or was closed, you can retry here.
              </p>
            </div>
          </div>
        )}

        {(canEdit || canDelete || canCancel) && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {canEdit && (
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/jobs/${jobId}/edit`}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Job
                  </Link>
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => deleteJob.mutate({ jobId })}
                  disabled={deleteJob.isPending}
                >
                  {deleteJob.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Job
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5"
                  onClick={() => setShowCancelReasonForm(true)}
                  disabled={cancelJob.isPending}
                >
                  {cancelJob.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Cancel Job
                </Button>
              )}
            </div>
          </div>
        )}

        {showCancelReasonForm && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Why are you cancelling this job?</h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  This helps SaskHandy understand why homeowners don’t move forward after receiving
                  bids, so we can improve trust and the hiring process.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {cancellationReasons.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setCancelReason(reason.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    cancelReason === reason.value
                      ? "border-amber-500 bg-white text-amber-950"
                      : "border-amber-200 bg-white/60 text-amber-900 hover:bg-white"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Textarea
                placeholder="Optional: share any extra context..."
                value={cancelDetails}
                onChange={(e) => setCancelDetails(e.target.value)}
                rows={3}
                className="bg-white"
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={handleCancelJob}
                disabled={!cancelReason || cancelJob.isPending}
                className="flex-1"
              >
                {cancelJob.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Confirm Cancellation
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelReasonForm(false);
                  setCancelReason("");
                  setCancelDetails("");
                }}
                disabled={cancelJob.isPending}
                className="flex-1"
              >
                Keep Job Open
              </Button>
            </div>
          </div>
        )}

        {payment && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-primary text-sm">Secure Payment</h3>
              <StatusBadge status={payment.status} />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">${payment.amount}</p>
                <p className="text-xs text-muted-foreground">Total Charged</p>
              </div>

              <div>
                <p className="text-lg font-bold text-foreground">${payment.handymanPayout}</p>
                <p className="text-xs text-muted-foreground">Handyman Payout</p>
              </div>

              <div>
                <p className="text-lg font-bold text-foreground">${payment.platformFee}</p>
                <p className="text-xs text-muted-foreground">Platform Fee</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-primary/10 flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p>
                Payment is held securely and released to the handyman only after you mark the job as
                completed.
              </p>
            </div>
          </div>
        )}

        {job.status === "in_progress" && isOwner && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Job in progress</p>
              <p className="text-xs text-muted-foreground mt-1">
                Once the work is done and you are satisfied, mark the job complete to release
                payment.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1"
                onClick={() => markComplete.mutate({ jobId, status: "completed" })}
                disabled={markComplete.isPending}
              >
                {markComplete.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark Job Complete
              </Button>

              <Button
                variant="outline"
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => setShowDisputeForm(true)}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Open Dispute
              </Button>
            </div>
          </div>
        )}

        {showDisputeForm && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Open a Dispute</h3>
            <p className="text-xs text-red-700 mb-3">
              Describe the issue. Our team will review and help resolve it.
            </p>

            <Textarea
              placeholder="Explain what went wrong..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={3}
              className="mb-3 bg-white"
            />

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => createDispute.mutate({ jobId, reason: disputeReason })}
                disabled={disputeReason.length < 10 || createDispute.isPending}
              >
                {createDispute.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : null}
                Submit Dispute
              </Button>

              <Button size="sm" variant="outline" onClick={() => setShowDisputeForm(false)}>
                Cancel
              </Button>
            </div>
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

        {job.status === "completed" && isOwner && job.selectedHandymanId && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-foreground">Rate the Handyman</h3>
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
                  placeholder="Share your experience with this handyman..."
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
                        revieweeId: job.selectedHandymanId!,
                        rating: reviewRating,
                        comment: reviewComment,
                      })
                    }
                    disabled={reviewRating === 0 || createReview.isPending}
                  >
                    {createReview.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : null}
                    Submit Review
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)}>
                <Star className="w-3.5 h-3.5 mr-1.5" />
                Leave a Review
              </Button>
            )}
          </div>
        )}

        {acceptedBid && (
          <div className="bg-white rounded-xl border border-emerald-200 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-foreground">
                {isAwaitingPayment ? "Accepted Bid — Payment Required" : "Accepted Bid"}
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <HandymanAvatar
                  imageUrl={(acceptedBid as any).handymanProfileImageUrl}
                  name={acceptedBid.handymanName}
                  size="md"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{acceptedBid.handymanName}</p>

                    {getBidInsuranceVerified(acceptedBid) && (
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Insurance Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {acceptedBid.handymanRating && (
                      <StarRatingDisplay
                        rating={parseFloat(acceptedBid.handymanRating)}
                        size="sm"
                        showValue
                      />
                    )}

                    {acceptedBid.handymanTotalJobs !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {acceptedBid.handymanTotalJobs} jobs completed
                      </span>
                    )}
                  </div>

                  {acceptedBid.availability && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {acceptedBid.availability}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-foreground">${acceptedBid.bidAmount}</p>

                <Link href={`/profile/${acceptedBid.handymanId}`}>
                  <span className="text-xs text-primary hover:underline cursor-pointer">
                    View Profile
                  </span>
                </Link>
              </div>
            </div>

            {acceptedBid.message && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">{acceptedBid.message}</p>
              </div>
            )}

            {canRetryPayment && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <Button
                  onClick={() => {
                    setPaymentBid(acceptedBid);
                    setShowPaymentModal(true);
                  }}
                >
                  Retry Secure Payment
                </Button>

                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <p>
                    Payment is held securely and released only after you mark the job as completed.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {job.selectedHandymanId && job.status !== "awaiting_payment" && (
          <JobChat
            jobId={jobId}
            otherPartyLabel={acceptedBid?.handymanName ?? "your handyman"}
          />
        )}

        {job.status === "open" && (
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Bids ({pendingBids.length})
                </h2>

                {pendingBids.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Open a bid to chat with the handyman, ask questions, and decide whether to
                    accept.
                  </p>
                )}
              </div>
            </div>

            {pendingBids.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Choosing a bid</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      You can chat with a handyman before choosing. Ask about their experience,
                      availability, and past work. Keep communication on SaskHandy so the job
                      details, payment, and dispute process stay protected.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {bidsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : pendingBids.length === 0 ? (
              <div className="bg-white rounded-xl border border-border/60 p-8 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />

                <h3 className="font-semibold text-foreground mb-2">No bids yet</h3>

                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Your job is live. Handymen can review it and send bids. Jobs with clear details,
                  realistic budgets, and photos usually get better responses.
                </p>

                {canEdit && (
                  <Button asChild variant="outline" size="sm" className="mt-5">
                    <Link href={`/jobs/${jobId}/edit`}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Improve Job Post
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBids.map((bid) => (
                  <div
                    key={bid.id}
                    className={`bg-white rounded-xl border p-5 ${
                      selectedBidId === bid.id ? "border-primary/40 shadow-sm" : "border-border/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <HandymanAvatar
                            imageUrl={(bid as any).handymanProfileImageUrl}
                            name={bid.handymanName}
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground text-sm">
                                {bid.handymanName ?? "Handyman"}
                              </p>

                              {getBidInsuranceVerified(bid) && (
                                <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  Insurance Verified
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {bid.handymanRating ? (
                                <StarRatingDisplay
                                  rating={parseFloat(bid.handymanRating)}
                                  size="sm"
                                  showValue
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">No rating yet</span>
                              )}

                              <span className="text-xs text-muted-foreground">
                                {getBidCompletedJobs(bid)} jobs completed
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-10">
                          <HandymanTrustSummary bid={bid} compact />
                        </div>

                        {bid.message && (
                          <p className="text-sm text-muted-foreground mt-2 ml-10 line-clamp-2">
                            {bid.message}
                          </p>
                        )}

                        {bid.availability && (
                          <div className="flex items-center gap-1 mt-1.5 ml-10">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {bid.availability}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-foreground">${bid.bidAmount}</p>

                        <div className="flex flex-col gap-2 mt-2 items-end">
                          <Button
                            size="sm"
                            onClick={() => setSelectedBidId(bid.id)}
                            variant={selectedBidId === bid.id ? "outline" : "default"}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                            {selectedBidId === bid.id ? "Bid Open" : "Review Bid"}
                          </Button>

                          <Link href={`/profile/${bid.handymanId}`}>
                            <span className="text-xs text-primary hover:underline cursor-pointer block">
                              View Profile
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BidChatDrawer
        bid={selectedBid}
        jobId={jobId}
        isOpen={!!selectedBid}
        onClose={() => setSelectedBidId(null)}
        onAccept={handleAcceptBid}
        onReject={(bidId) => rejectBid.mutate({ bidId })}
        onReport={handleReportBid}
        acceptPending={acceptBid.isPending}
        rejectPending={rejectBid.isPending || createReport.isPending || reportingBidId === selectedBid?.id}
      />

      {showPaymentModal && modalBid && (
        <StripePaymentModal
          jobId={jobId}
          amount={parseFloat(modalBid.bidAmount)}
          onSuccess={async () => {
            setShowPaymentModal(false);
            setPaymentBid(null);
            toast.success("Payment submitted. Once confirmed, the job will move into active work.");
            await utils.jobs.getById.invalidate({ jobId });
            await utils.payments.getByJob.invalidate({ jobId });
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </AppLayout>
  );
}