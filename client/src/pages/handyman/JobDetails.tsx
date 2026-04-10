import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { JobChat } from "@/components/JobChat";
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
  Star,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function HandymanJobDetails() {
  const { id } = useParams();
  const jobId = parseInt(id ?? "0");
  const { user } = useAuth();
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

  const { data: job, isLoading } = trpc.jobs.getById.useQuery({ jobId }, { enabled: !!jobId });
  const { data: bids } = trpc.bids.getForJob.useQuery({ jobId }, { enabled: !!jobId });
  const { data: dispute } = trpc.disputes.getByJob.useQuery({ jobId }, { enabled: !!jobId && job?.status === "disputed" });
  const { data: myReview } = trpc.reviews.getMyReview.useQuery({ jobId }, { enabled: !!jobId && job?.status === "completed" });

  const myBid = bids?.find((b) => b.handymanId === user?.id);
  const isAssignedHandyman = job?.selectedHandymanId === user?.id;

  const createBid = trpc.bids.create.useMutation({
    onSuccess: () => {
      toast.success("Bid placed! The homeowner will review your bid.");
      setShowBidForm(false);
      setBidAmount("");
      setBidMessage("");
      setAvailability("");
      utils.bids.getForJob.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  const createDispute = trpc.disputes.create.useMutation({
    onSuccess: () => {
      toast.success("Dispute opened. Our team will review it shortly.");
      setShowDisputeForm(false);
      utils.jobs.getById.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted!");
      setShowReviewForm(false);
      utils.reviews.getMyReview.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
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

  const estimatedPayout = bidAmount ? (parseFloat(bidAmount) * 0.8).toFixed(2) : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Link href="/handyman/browse">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </div>
        </Link>

        {/* Job Details */}
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
              <p className="text-sm font-medium">{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
        </div>

        {/* My Bid Status */}
        {myBid && (
          <div className={`rounded-xl border p-5 mb-6 ${
            myBid.status === "accepted" ? "bg-emerald-50 border-emerald-200" :
            myBid.status === "rejected" ? "bg-red-50 border-red-200" :
            "bg-amber-50 border-amber-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">Your Bid</p>
                  <StatusBadge status={myBid.status} />
                </div>
                {myBid.message && <p className="text-xs text-muted-foreground">{myBid.message}</p>}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${myBid.bidAmount}</p>
                <p className="text-xs text-muted-foreground">You keep ${(parseFloat(myBid.bidAmount) * 0.8).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bid Form */}
        {job.status === "open" && !myBid && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            {!showBidForm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">Interested in this job?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Place a competitive bid to win this job.</p>
                </div>
                <Button onClick={() => setShowBidForm(true)}>
                  Place a Bid
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Place Your Bid</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="bidAmount">Bid Amount <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      You'll receive <strong>${estimatedPayout}</strong> (80% after platform fee)
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    placeholder="e.g., Available this weekend, Mon–Fri after 3pm"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Message to Homeowner</Label>
                  <Textarea
                    id="message"
                    placeholder="Briefly describe your approach, experience, and why you're the right person for this job..."
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      createBid.mutate({
                        jobId,
                        bidAmount: parseFloat(bidAmount),
                        message: bidMessage || undefined,
                        availability: availability || undefined,
                      })
                    }
                    disabled={!bidAmount || parseFloat(bidAmount) <= 0 || createBid.isPending}
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

        {isAssignedHandyman && (
          <JobChat
            jobId={jobId}
            otherPartyLabel={job.homeownerName ?? "the homeowner"}
          />
        )}

        {/* Dispute for assigned handyman */}
        {isAssignedHandyman && job.status === "in_progress" && (
          <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
            {!showDisputeForm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">Issue with this job?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Open a dispute if there's a problem.</p>
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
                    Submit Dispute
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowDisputeForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dispute status */}
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

        {/* Review section for completed jobs */}
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
                    onClick={() => createReview.mutate({
                      jobId,
                      revieweeId: job.homeownerId,
                      rating: reviewRating,
                      comment: reviewComment,
                    })}
                    disabled={reviewRating === 0 || createReview.isPending}
                  >
                    Submit Review
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
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
      </div>
    </AppLayout>
  );
}
