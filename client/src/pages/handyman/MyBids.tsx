import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, Clock, Loader2, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function MyBids() {
  const { isAuthenticated } = useAuth();
  const { data: bids, isLoading } = trpc.bids.getForHandyman.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const pending = bids?.filter((b) => b.status === "pending") ?? [];
  const accepted = bids?.filter((b) => b.status === "accepted") ?? [];
  const rejected = bids?.filter((b) => b.status === "rejected") ?? [];

  type Bid = NonNullable<typeof bids>[number];
  const BidCard = ({ bid }: { bid: Bid }) => (
    <Link href={`/handyman/jobs/${bid.jobId}`}>
      <div className="bg-white rounded-xl border border-border/60 p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-foreground text-sm truncate">{bid.jobTitle ?? "Job"}</p>
              <StatusBadge status={bid.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {bid.jobLocation && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{bid.jobLocation}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
            {bid.message && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{bid.message}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-foreground">${bid.bidAmount}</p>
            <p className="text-xs text-muted-foreground">
              You keep ${(parseFloat(bid.bidAmount) * 0.8).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <AppLayout title="My Bids">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Bids">
      {!bids || bids.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/60 p-12 text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">No bids yet</h3>
          <p className="text-sm text-muted-foreground">
            Browse available jobs and start placing bids to win work.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">
                Pending <span className="text-muted-foreground font-normal">({pending.length})</span>
              </h2>
              <div className="space-y-3">
                {pending.map((bid) => <BidCard key={bid.id} bid={bid} />)}
              </div>
            </section>
          )}
          {accepted.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">
                Accepted <span className="text-muted-foreground font-normal">({accepted.length})</span>
              </h2>
              <div className="space-y-3">
                {accepted.map((bid) => <BidCard key={bid.id} bid={bid} />)}
              </div>
            </section>
          )}
          {rejected.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">
                Rejected <span className="text-muted-foreground font-normal">({rejected.length})</span>
              </h2>
              <div className="space-y-3">
                {rejected.map((bid) => <BidCard key={bid.id} bid={bid} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </AppLayout>
  );
}
