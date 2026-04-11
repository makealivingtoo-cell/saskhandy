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
import { Bell, Briefcase, MessageSquare } from "lucide-react";
import { Link } from "wouter";

type NotificationItem = {
  id: string;
  kind: "message" | "bid";
  title: string;
  body: string;
  href: string;
  createdAt: string | Date;
};

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
    user,
    jobs,
    homeownerJobs,
    handymanJobs,
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

export function NotificationBell() {
  const { user, jobs } = useConversationJobs();
  const isHandyman = user?.userType === "handyman";

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

  const homeownerBidQueries = trpc.useQueries((t) =>
    !isHandyman
      ? jobs.map((job) =>
          t.bids.getForJob(
            { jobId: job.id },
            {
              refetchInterval: 10000,
              refetchOnWindowFocus: true,
            }
          )
        )
      : []
  );

  const handymanBids = trpc.bids.getForHandyman.useQuery(undefined, {
    enabled: !!isHandyman,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const notifications: NotificationItem[] = [];

  jobs.forEach((job, index) => {
    const unread = unreadQueries[index]?.data ?? 0;
    if (unread > 0) {
      notifications.push({
        id: `msg-${job.id}`,
        kind: "message",
        title: unread === 1 ? "New message" : `${unread} unread messages`,
        body: job.title,
        href: isHandyman ? `/handyman/jobs/${job.id}` : `/jobs/${job.id}`,
        createdAt: job.updatedAt ?? job.createdAt,
      });
    }
  });

  if (!isHandyman) {
    jobs.forEach((job, index) => {
      const bids = homeownerBidQueries[index]?.data ?? [];
      const pendingBids = bids.filter((bid) => bid.status === "pending");

      if (pendingBids.length > 0) {
        notifications.push({
          id: `bid-${job.id}`,
          kind: "bid",
          title: pendingBids.length === 1 ? "New bid received" : `${pendingBids.length} new bids`,
          body: job.title,
          href: `/jobs/${job.id}`,
          createdAt: pendingBids[pendingBids.length - 1]?.createdAt ?? job.updatedAt ?? job.createdAt,
        });
      }
    });
  } else {
    const acceptedBids =
      handymanBids.data?.filter(
        (bid) => bid.status === "accepted" && bid.jobStatus !== "completed" && bid.jobStatus !== "cancelled"
      ) ?? [];

    acceptedBids.forEach((bid) => {
      notifications.push({
        id: `accepted-${bid.id}`,
        kind: "bid",
        title: "Your bid was accepted",
        body: bid.jobTitle ?? `Job #${bid.jobId}`,
        href: `/handyman/jobs/${bid.jobId}`,
        createdAt: bid.createdAt,
      });
    });
  }

  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const hasUnreadOrNew = notifications.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {hasUnreadOrNew && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No new notifications</p>
            <p className="text-xs text-muted-foreground mt-1">
              New bids and unread messages will show up here.
            </p>
          </div>
        ) : (
          notifications.slice(0, 8).map((item) => (
            <DropdownMenuItem key={item.id} asChild className="p-0">
              <Link href={item.href}>
                <div className="w-full px-3 py-3 cursor-pointer flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.kind === "message" ? (
                      <MessageSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.body}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}