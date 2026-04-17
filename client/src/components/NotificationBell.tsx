import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

  return {
    jobs,
  };
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

function NotificationIcon({
  type,
}: {
  type:
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
}) {
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

export function NotificationBell() {
  const utils = trpc.useUtils();

  const { data: notifications = [] } = trpc.notifications.getMine.useQuery(
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-semibold px-1 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>

          {notifications.length > 0 && unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
              disabled={markAllRead.isPending}
            >
              Mark all read
            </button>
          )}
        </div>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              New messages, payouts, bids, and job updates will show up here.
            </p>
          </div>
        ) : (
          notifications.slice(0, 8).map((item) => {
            const href = item.link || (item.type === "new_message" ? "/messages" : "/dashboard");

            return (
              <DropdownMenuItem key={item.id} asChild className="p-0">
                <Link href={href}>
                  <div
                    className="w-full px-3 py-3 cursor-pointer flex items-start gap-3"
                    onClick={() => {
                      if (!item.read) {
                        markRead.mutate({ notificationId: item.id });
                      }
                    }}
                  >
                    <div className="mt-0.5">
                      <NotificationIcon type={item.type} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {!item.read && (
                          <span className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">{item.message}</p>

                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}