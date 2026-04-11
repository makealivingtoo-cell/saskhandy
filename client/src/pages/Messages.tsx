import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Loader2, MapPin, MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function MessagesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const homeownerJobs = trpc.jobs.getByHomeowner.useQuery(undefined, {
    enabled: isAuthenticated && user?.userType !== "handyman",
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const handymanJobs = trpc.jobs.getForHandyman.useQuery(undefined, {
    enabled: isAuthenticated && user?.userType === "handyman",
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
    }
  }, [loading, isAuthenticated, navigate]);

  const isHandyman = user?.userType === "handyman";

  const jobs = isHandyman
    ? handymanJobs.data ?? []
    : (homeownerJobs.data ?? []).filter((job) => !!job.selectedHandymanId);

  const unreadQueries = trpc.useQueries((t) =>
    jobs.map((job) =>
      t.messages.getUnreadCount(
        { jobId: job.id },
        {
          refetchInterval: 10000,
          refetchOnWindowFocus: true,
        }
      )
    )
  );

  const totalUnread = unreadQueries.reduce((sum, query) => sum + (query.data ?? 0), 0);

  const isLoading = loading || homeownerJobs.isLoading || handymanJobs.isLoading;

  const sortedJobs = [...jobs].sort((a, b) => {
    const left = new Date(a.updatedAt ?? a.createdAt).getTime();
    const right = new Date(b.updatedAt ?? b.createdAt).getTime();
    return right - left;
  });

  return (
    <AppLayout title="Messages">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <p className="text-sm text-muted-foreground">
            {sortedJobs.length} active {sortedJobs.length === 1 ? "conversation" : "conversations"}
          </p>
          {totalUnread > 0 && (
            <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold px-2">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="font-semibold text-foreground mb-2">No active conversations yet</h2>
            <p className="text-sm text-muted-foreground">
              {isHandyman
                ? "Once a homeowner accepts one of your bids, your conversation will appear here."
                : "Once you accept a handyman for a job, your conversation will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedJobs.map((job) => {
              const href = isHandyman ? `/handyman/jobs/${job.id}` : `/jobs/${job.id}`;
              const unread =
                unreadQueries.find((query) => query.dataUpdatedAt && query.data !== undefined)?.data ??
                unreadQueries[jobs.findIndex((j) => j.id === job.id)]?.data ??
                0;

              return (
                <Link key={job.id} href={href}>
                  <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-foreground text-sm truncate">{job.title}</p>
                          <StatusBadge status={job.status} />
                          {unread > 0 && (
                            <span className="inline-flex items-center rounded-full bg-red-500 text-white text-xs font-medium px-2 py-1">
                              {unread} unread
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{job.location}</span>
                          </div>
                          <span>
                            Updated{" "}
                            {formatDistanceToNow(new Date(job.updatedAt ?? job.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center text-primary">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}