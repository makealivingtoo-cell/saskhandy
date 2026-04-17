import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Briefcase,
  CheckCircle,
  DollarSign,
  MessageSquare,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { Link } from "wouter";

function useConversationJobs() {
  const { user, isAuthenticated } = useAuth();

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

  const jobs =
    user?.userType === "handyman"
      ? handymanJobs.data ?? []
      : (homeownerJobs.data ?? []).filter((job) => !!job.selectedHandymanId);

  return { jobs };
}

export function useUnreadMessageTotal() {
  const { jobs } = useConversationJobs();

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

  return unreadQueries.reduce((sum, query) => sum + (query.data ?? 0), 0);
}

export function MessagesCounterBadge() {
  const totalUnread = useUnreadMessageTotal();

  if (totalUnread <= 0) return null;

  return (
    <span className="ml-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5">
      {totalUnread > 99 ? "99+" : totalUnread}
    </span>
  );
}

type NotificationType =
  | "new_bid"
  | "bid_accepted"
  | "new_message"
  | "payment_received"
  | "job_completed"
  | "dispute_opened"
  | "dispute_resolved"
  | "payout_requested"
  | "payout_paid"
  | "payout_rejected"
  | "system";

function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === "new_message") {
    return <MessageSquare className="w-4 h-4 text-primary" />;
  }

  if (type === "new_bid" || type === "bid_accepted") {
    return <Briefcase className="w-4 h-4 text-primary" />;
  }

  if (type === "payment_received" || type === "payout_requested") {
    return <DollarSign className="w-4 h-4 text-primary" />;
  }

  if (type === "payout_paid" || type === "payout_rejected") {
    return <Wallet className="w-4 h-4 text-primary" />;
  }

  if (type === "job_completed" || type === "dispute_resolved") {
    return <CheckCircle className="w-4 h-4 text-primary" />;
  }

  if (type === "dispute_opened") {
    return <ShieldAlert className="w-4 h-4 text-primary" />;
  }

  return <Bell className="w-4 h-4 text-primary" />;
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3 px-2 pb-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl p-2">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-muted rounded-full animate-pulse w-full" />
            <div className="h-3 bg-muted rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationBell() {
  const utils = trpc.useUtils();

  const {
    data: notifications = [],
    isLoading,
    isFetching,
  } = trpc.notifications.getMine.useQuery(
    { limit: 20 },
    {
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
    }
  );

  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: async () => {
      await utils.notifications.getMine.invalidate();
      await utils.notifications.getUnreadCount.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: async () => {
      await utils.notifications.getMine.invalidate();
      await utils.notifications.getUnreadCount.invalidate();
    },
  });

  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-primary/10"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />

          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 flex items-center justify-center border-2 border-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[380px] max-w-[calc(100vw-24px)] rounded-2xl border border-border/70 bg-white p-0 shadow-2xl overflow-hidden"
      >
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-foreground">Notifications</h2>

            {notifications.length > 0 && unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                disabled={markAllRead.isPending}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[520px] overflow-y-auto px-2 pb-2">
          {isLoading || (isFetching && notifications.length === 0) ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Messages, payouts, bids, and job updates will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((item) => {
                const href =
                  item.link || (item.type === "new_message" ? "/messages" : "/dashboard");

                return (
                  <Link key={item.id} href={href}>
                    <div
                      onClick={() => {
                        if (!item.read) {
                          markRead.mutate({ notificationId: item.id });
                        }
                      }}
                      className={`relative flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer transition-colors ${
                        item.read ? "hover:bg-muted/60" : "bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <NotificationIcon type={item.type} />
                      </div>

                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-sm text-foreground leading-snug">
                          <span className="font-semibold">{item.title}</span>{" "}
                          <span className="text-muted-foreground">{item.message}</span>
                        </p>

                        <p
                          className={`text-xs mt-1 font-medium ${
                            item.read ? "text-muted-foreground" : "text-primary"
                          }`}
                        >
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {!item.read && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}