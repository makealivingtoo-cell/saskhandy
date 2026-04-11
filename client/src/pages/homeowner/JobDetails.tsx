import { useAuth } from "@/_core/hooks/useAuth";
import { StripePaymentModal } from "@/components/StripePaymentModal";
import { JobChat } from "@/components/JobChat";
import { AppLayout } from "@/components/AppLayout";
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
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Shield,
  Star,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

function getBidInsuranceVerified(bid: any) {
  return bid?.handymanInsuranceVerified === true;
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
      await utils.jobs.getById.invalidate({ jobId });
      await utils.bids.getForJob.invalidate({ jobId });
      await utils.payments.getByJob.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectBid = trpc.bids.reject.useMutation({
    onSuccess: async () => {
      toast.success("Bid rejected.");
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
      toast.success("Job cancelled.");
      await utils.jobs.getById.invalidate({ jobId });
      await utils.jobs.getByHomeowner.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

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

  const canEdit = isOwner && job.status === "open" && !job.selectedBidId && !job.selectedHandymanId;
  const canDelete = canEdit && pendingBids.length === 0 && !payment;
  const canCancel = canEdit && pendingBids.length > 0;
  const isAwaitingPayment = job.status === "awaiting_payment";
  const canRetryPayment = isAwaitingPayment && !!acceptedBid;

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

        {isAwaitingPayment && acceptedBid && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <h3 className="font-semibold text-amber-800">Awaiting payment</h3>
            </div>
            <p className="text-sm text-amber-700 mb-4">
              Your bid has been accepted, but the job is not officially active yet. Complete payment to start the job and move it into active work.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setShowPaymentModal(true)}>Complete Payment</Button>
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
                  onClick={() => cancelJob.mutate({ jobId })}
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

        {payment && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-primary text-sm">Escrow Payment</h3>
              <StatusBadge status={payment.status} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">${payment.amount}</p>
                <p className="text-xs text-muted-foreground">Total Charged</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">${payment.handymanPayout}</p>
                <p className="text-xs text-muted-foreground">Handyman Payout (80%)</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">${payment.platformFee}</p>
                <p className="text-xs text-muted-foreground">Platform Fee (20%)</p>
              </div>
            </div>
          </div>
        )}

        {job.status === "in_progress" && isOwner && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6 flex flex-col sm:flex-row gap-3">
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
        )}

        {showDisputeForm && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Open a Dispute</h3>
            <p className="text-xs text-red-700 mb-3">
              Describe the issue. Our team will review and resolve it.
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
                    <span className="text-xs text-muted-foreground">{acceptedBid.availability}</span>
                  </div>
                )}
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
                <Button onClick={() => setShowPaymentModal(true)}>Retry Payment</Button>
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
            <h2 className="text-base font-semibold text-foreground mb-3">
              Bids ({pendingBids.length})
            </h2>
            {bidsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : pendingBids.length === 0 ? (
              <div className="bg-white rounded-xl border border-border/60 p-8 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No bids yet. Handymen will start bidding soon.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBids.map((bid) => (
                  <div key={bid.id} className="bg-white rounded-xl border border-border/60 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>

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
                              {bid.handymanRating && (
                                <StarRatingDisplay
                                  rating={parseFloat(bid.handymanRating)}
                                  size="sm"
                                  showValue
                                />
                              )}
                              {bid.handymanTotalJobs !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  {bid.handymanTotalJobs} jobs completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {bid.message && (
                          <p className="text-sm text-muted-foreground mt-2 ml-10">{bid.message}</p>
                        )}
                        {bid.availability && (
                          <div className="flex items-center gap-1 mt-1.5 ml-10">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{bid.availability}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-foreground">${bid.bidAmount}</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => acceptBid.mutate({ bidId: bid.id })}
                            disabled={acceptBid.isPending}
                          >
                            {acceptBid.isPending ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : null}
                            Accept & Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectBid.mutate({ bidId: bid.id })}
                            disabled={rejectBid.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                        <Link href={`/profile/${bid.handymanId}`}>
                          <span className="text-xs text-primary hover:underline cursor-pointer block mt-1">
                            View Profile
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showPaymentModal && acceptedBid && (
        <StripePaymentModal
          jobId={jobId}
          amount={parseFloat(acceptedBid.bidAmount)}
          onSuccess={async () => {
            setShowPaymentModal(false);
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