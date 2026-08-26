import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Loader2, MapPin, MessageSquare } from "lucide-react";
import { useEffect, useMemo } from "react";
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
    ? (handymanJobs.data ?? [])
    : (homeownerJobs.data ?? []).filter((job) => !!job.selectedHandymanId);

  const unreadQueries = trpc.useQueries((t) =>
    jobs.map((job) =>
      t.messages.getUnreadCount(
        { jobId: job.id },
        {
          refetchInterval: 10000,
          refetchOnWindowFocus: true,
        },
      ),
    ),
  );

  const unreadByJobId = useMemo(
    () =>
      new Map(
        jobs.map((job, index) => [job.id, unreadQueries[index]?.data ?? 0]),
      ),
    [jobs, unreadQueries],
  );

  const totalUnread = Array.from(unreadByJobId.values()).reduce(
    (sum, count) => sum + count,
    0,
  );
  const isLoading =
    loading || homeownerJobs.isLoading || handymanJobs.isLoading;

  const sortedJobs = [...jobs].sort((a, b) => {
    const left = new Date(a.updatedAt ?? a.createdAt).getTime();
    const right = new Date(b.updatedAt ?? b.createdAt).getTime();
    return right - left;
  });

  const getNextStep = (status: string) => {
    if (status === "awaiting_payment") {
      return isHandyman
        ? "Waiting for homeowner payment"
        : "Payment needed to start";
    }
    if (status === "in_progress") {
      return isHandyman
        ? "Confirm timing and keep the homeowner updated"
        : "Job active — coordinate here";
    }
    if (status === "completed") return "Job complete";
    if (status === "disputed") return "Dispute in review";
    if (status === "cancelled") return "Job cancelled";
    return isHandyman
      ? "Waiting for homeowner decision"
      : "Review the job conversation";
  };

  return (
    <AppLayout title="Messages">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {sortedJobs.length} job{" "}
              {sortedJobs.length === 1 ? "conversation" : "conversations"}
            </p>
            {totalUnread > 0 && (
              <p className="mt-1 text-xs font-medium text-primary">
                {totalUnread} unread{" "}
                {totalUnread === 1 ? "message" : "messages"}
              </p>
            )}
          </div>

          {totalUnread > 0 && (
            <span className="inline-flex min-w-8 h-8 items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold px-2">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 sm:p-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="font-semibold text-foreground mb-2">
              No job conversations yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isHandyman
                ? "Once you bid on jobs and a homeowner starts working with you, conversations will appear here."
                : "Once you choose a handyman for a job, your conversation will stay here with the job."}
            </p>

            <Button asChild className="mt-5">
              <Link href={isHandyman ? "/handyman/browse" : "/post-job"}>
                {isHandyman ? "Browse Jobs" : "Post a Job"}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedJobs.map((job) => {
              const href = isHandyman
                ? `/handyman/jobs/${job.id}`
                : `/jobs/${job.id}`;
              const unread = unreadByJobId.get(job.id) ?? 0;

              return (
                <Link key={job.id} href={href}>
                  <div
                    className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                      unread > 0
                        ? "border-primary/30 shadow-sm ring-1 ring-primary/5"
                        : "border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {job.title}
                          </p>
                          <StatusBadge status={job.status} />
                          {unread > 0 && (
                            <span className="inline-flex items-center rounded-full bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5">
                              {unread} new
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-medium text-foreground/80 mb-2">
                          {getNextStep(job.status)}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <span>
                            Updated{" "}
                            {formatDistanceToNow(
                              new Date(job.updatedAt ?? job.createdAt),
                              { addSuffix: true },
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center text-primary pt-1">
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
