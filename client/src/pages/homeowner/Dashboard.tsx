import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MessageSquare,
  Plus,
  ShieldAlert,
  Star,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border/60 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "new_message") return <MessageSquare className="w-4 h-4 text-primary" />;
  if (type === "new_bid" || type === "bid_accepted") return <Briefcase className="w-4 h-4 text-primary" />;
  if (type === "payment_received" || type === "payout_requested") return <DollarSign className="w-4 h-4 text-primary" />;
  if (type === "job_completed" || type === "dispute_resolved") return <CheckCircle className="w-4 h-4 text-primary" />;
  if (type === "dispute_opened") return <ShieldAlert className="w-4 h-4 text-primary" />;
  return <Bell className="w-4 h-4 text-primary" />;
}

export default function HomeownerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: jobs, isLoading } = trpc.jobs.getByHomeowner.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: notifications = [], isLoading: notificationsLoading } =
    trpc.notifications.getMine.useQuery(
      { limit: 5 },
      {
        enabled: isAuthenticated,
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
      }
    );

  const markNotificationRead = trpc.notifications.markRead.useMutation({
    onSuccess: async () => {
      await utils.notifications.getMine.invalidate();
      await utils.notifications.getUnreadCount.invalidate();
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
    if (!loading && isAuthenticated && user?.userType !== "homeowner" && user?.role !== "admin") {
      navigate("/role-select");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const openJobs = jobs?.filter((j) => j.status === "open") ?? [];
  const activeJobs = jobs?.filter((j) => j.status === "in_progress") ?? [];
  const completedJobs = jobs?.filter((j) => j.status === "completed") ?? [];

  if (loading || isLoading) {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-foreground">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 17
              ? "afternoon"
              : "evening"}
            , {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's an overview of your jobs.</p>
        </div>
        <Button asChild>
          <Link href="/post-job">
            <Plus className="w-4 h-4 mr-2" />
            Post a Job
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Open Jobs"
          value={openJobs.length}
          icon={Briefcase}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="In Progress"
          value={activeJobs.length}
          icon={Clock}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Completed"
          value={completedJobs.length}
          icon={Star}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Total Jobs"
          value={jobs?.length ?? 0}
          icon={Briefcase}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-border/60 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Recent Notifications</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              New bids, messages, payments, and dispute updates will appear here.
            </p>
          </div>
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>

        {notificationsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-muted/40 rounded-lg p-6 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              You’ll see job updates here once activity starts.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const href = notification.link || "/dashboard";

              return (
                <Link key={notification.id} href={href}>
                  <div
                    onClick={() => {
                      if (!notification.read) {
                        markNotificationRead.mutate({ notificationId: notification.id });
                      }
                    }}
                    className="flex items-start gap-3 rounded-lg border border-border/50 p-3 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <NotificationIcon type={notification.type} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>

                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/60 p-12 text-center">
          <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No jobs yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Post your first job and start receiving bids from qualified handymen.
          </p>
          <Button asChild>
            <Link href="/post-job">
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground mb-3">Your Jobs</h2>
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <div className="bg-white rounded-xl border border-border/60 p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-0.5 rounded-full">
                        {job.category}
                      </span>
                      <span>{job.location}</span>
                      <span>
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">
                      ${job.budgetMin}–${job.budgetMax}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">budget</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}