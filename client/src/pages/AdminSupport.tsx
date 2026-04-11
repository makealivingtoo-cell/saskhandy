import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "replied" | "closed";

export default function AdminSupportPage() {
  const utils = trpc.useUtils();

  const { data: tickets = [], isLoading } = trpc.support.getAll.useQuery(undefined, {
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");

  const filteredTickets = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  const selectedTicket =
    filteredTickets.find((ticket) => ticket.id === selectedTicketId) ??
    tickets.find((ticket) => ticket.id === selectedTicketId) ??
    null;

  const { data: messages = [], isLoading: messagesLoading } = trpc.support.getMessages.useQuery(
    { ticketId: selectedTicketId ?? 0 },
    {
      enabled: !!selectedTicketId,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    }
  );

  const sendReply = trpc.support.reply.useMutation({
    onSuccess: async () => {
      setReply("");
      toast.success("Reply sent.");
      if (selectedTicketId) {
        await utils.support.getMessages.invalidate({ ticketId: selectedTicketId });
        await utils.support.getAll.invalidate();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatus = trpc.support.updateStatus.useMutation({
    onSuccess: async (_, variables) => {
      toast.success(`Ticket marked ${variables.status}.`);
      await utils.support.getAll.invalidate();
      if (selectedTicketId) {
        await utils.support.getById.invalidate({ ticketId: selectedTicketId });
        await utils.support.getMessages.invalidate({ ticketId: selectedTicketId });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const openCount = tickets.filter((ticket) => ticket.status === "open").length;
  const repliedCount = tickets.filter((ticket) => ticket.status === "replied").length;
  const closedCount = tickets.filter((ticket) => ticket.status === "closed").length;

  const quickReplies = [
    "Thanks for reaching out. We’re reviewing this and will update you shortly.",
    "Please send any screenshots, error messages, or extra details so we can investigate properly.",
    "Your payment issue is under review. We’ll confirm the next step as soon as possible.",
    "Your dispute has been noted and escalated for admin review.",
    "Thanks — we’ve received your message and will follow up soon.",
  ];

  return (
    <AppLayout title="Support Inbox">
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-foreground">Tickets</h2>
            <span className="text-xs text-muted-foreground">{filteredTickets.length} shown</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: "all", label: "All", count: tickets.length },
              { key: "open", label: "Open", count: openCount },
              { key: "replied", label: "Replied", count: repliedCount },
              { key: "closed", label: "Closed", count: closedCount },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key as "all" | TicketStatus)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === item.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No support tickets in this view.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 transition-colors",
                    selectedTicketId === ticket.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {ticket.subject}
                    </p>
                    <span
                      className={cn(
                        "text-[11px] px-2 py-1 rounded-full capitalize whitespace-nowrap",
                        ticket.status === "open" &&
                          "bg-amber-50 text-amber-700 border border-amber-200",
                        ticket.status === "replied" &&
                          "bg-blue-50 text-blue-700 border border-blue-200",
                        ticket.status === "closed" &&
                          "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground capitalize mb-1">
                    {ticket.category}
                  </p>

                  <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                    <span>Ticket #{ticket.id}</span>
                    <span>
                      {formatDistanceToNow(new Date(ticket.updatedAt ?? ticket.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          {!selectedTicket ? (
            <div className="text-center py-20">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No ticket selected</p>
              <p className="text-sm text-muted-foreground">
                Choose a support ticket from the left to view and reply.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground capitalize">
                      {selectedTicket.category}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      Ticket #{selectedTicket.id}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateStatus.mutate({ ticketId: selectedTicket.id, status: "open" })
                    }
                    disabled={updateStatus.isPending}
                  >
                    Mark Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateStatus.mutate({ ticketId: selectedTicket.id, status: "replied" })
                    }
                    disabled={updateStatus.isPending}
                  >
                    Mark Replied
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateStatus.mutate({ ticketId: selectedTicket.id, status: "closed" })
                    }
                    disabled={updateStatus.isPending}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 min-h-[320px] max-h-[500px] overflow-y-auto space-y-3">
                {messagesLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "rounded-2xl px-4 py-3 max-w-[85%]",
                        msg.senderRole === "admin"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-white border border-border/60"
                      )}
                    >
                      <p className="text-xs font-medium mb-1">
                        {msg.senderRole === "admin" ? "Admin" : "User"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[11px] opacity-80 mt-2">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {selectedTicket.status !== "closed" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Quick replies</p>
                    <div className="flex flex-wrap gap-2">
                      {quickReplies.map((quickReply) => (
                        <button
                          key={quickReply}
                          type="button"
                          onClick={() => setReply(quickReply)}
                          className="text-xs rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-left"
                        >
                          {quickReply}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Write a response..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={5}
                  />

                  <div className="flex justify-end">
                    <Button
                      onClick={() =>
                        sendReply.mutate({ ticketId: selectedTicket.id, content: reply })
                      }
                      disabled={sendReply.isPending || !reply.trim()}
                    >
                      {sendReply.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {selectedTicket.status === "closed" && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    This ticket is closed. Reopen it to continue the conversation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}