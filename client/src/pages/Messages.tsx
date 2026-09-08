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

  const inbox = trpc.messages.getInbox.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
    }
  }, [loading, isAuthenticated, navigate]);

  const isHandyman = user?.userType === "handyman";
  const conversations = inbox.data ?? [];
  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );

  const { needsAttention, active } = useMemo(() => {
    const attention = conversations.filter(
      (conversation) =>
        conversation.unreadCount > 0 ||
        (!isHandyman && conversation.status === "awaiting_payment"),
    );
    const attentionIds = new Set(attention.map((conversation) => conversation.id));
    return {
      needsAttention: attention,
      active: conversations.filter((conversation) => !attentionIds.has(conversation.id)),
    };
  }, [conversations, isHandyman]);

  const getNextStep = (status: string) => {
    if (status === "awaiting_payment") {
      return isHandyman
        ? "Payment pending — agree on likely timing"
        : "Payment needed before work starts";
    }
    if (status === "in_progress") {
      return isHandyman
        ? "Coordinate arrival and job updates"
        : "Coordinate the visit here";
    }
    if (status === "completed") return "Job complete";
    if (status === "disputed") return "Dispute in review";
    if (status === "cancelled") return "Job cancelled";
    return "Open conversation";
  };

  const renderConversation = (conversation: (typeof conversations)[number]) => {
    const href = isHandyman
      ? `/handyman/jobs/${conversation.id}`
      : `/jobs/${conversation.id}`;
    const hasUnread = conversation.unreadCount > 0;
    const latestTime =
      conversation.lastMessage?.createdAt ??
      conversation.updatedAt ??
      conversation.createdAt;
    const preview = conversation.lastMessage
      ? `${conversation.lastMessage.senderId === user?.id ? "You: " : ""}${conversation.lastMessage.content}`
      : "No messages yet — start coordinating the job.";
    const initials = conversation.otherPartyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

    return (
      <Link key={conversation.id} href={href}>
        <div
          className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
            hasUnread
              ? "border-primary/35 shadow-sm ring-1 ring-primary/10"
              : "border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md"
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {initials || "SH"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {conversation.otherPartyName}
                    </p>
                    <StatusBadge status={conversation.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {conversation.title}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {hasUnread && (
                    <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5">
                      {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </div>

              <p
                className={`mt-3 text-sm line-clamp-1 ${
                  hasUnread ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {preview}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs font-medium text-primary">
                  {getNextStep(conversation.status)}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 max-w-[180px]">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{conversation.location}</span>
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(latestTime), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <AppLayout title="Messages">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {conversations.length} job {conversations.length === 1 ? "conversation" : "conversations"}
            </p>
            {totalUnread > 0 && (
              <p className="mt-1 text-xs font-medium text-primary">
                {totalUnread} unread {totalUnread === 1 ? "message" : "messages"}
              </p>
            )}
          </div>

          {totalUnread > 0 && (
            <span className="inline-flex min-w-8 h-8 items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold px-2">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>

        {loading || inbox.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 sm:p-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="font-semibold text-foreground mb-2">No job conversations yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isHandyman
                ? "Once a homeowner accepts your bid, the job conversation will stay here from payment through completion."
                : "Once you choose a handyman, your job conversation will stay here from payment through completion."}
            </p>

            <Button asChild className="mt-5">
              <Link href={isHandyman ? "/handyman/browse" : "/post-job"}>
                {isHandyman ? "Browse Jobs" : "Post a Job"}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {needsAttention.length > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    Needs your attention
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    {needsAttention.length}
                  </span>
                </div>
                <div className="space-y-3">{needsAttention.map(renderConversation)}</div>
              </section>
            )}

            {active.length > 0 && (
              <section>
                {needsAttention.length > 0 && (
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                      Other conversations
                    </h2>
                    <span className="text-[11px] text-muted-foreground">{active.length}</span>
                  </div>
                )}
                <div className="space-y-3">{active.map(renderConversation)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
