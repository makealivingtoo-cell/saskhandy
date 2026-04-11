import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function AdminSupportPage() {
  const utils = trpc.useUtils();
  const { data: tickets = [], isLoading } = trpc.support.getAll.useQuery();
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [reply, setReply] = useState("");

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  const { data: messages = [] } = trpc.support.getMessages.useQuery(
    { ticketId: selectedTicketId ?? 0 },
    { enabled: !!selectedTicketId }
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
    onSuccess: async () => {
      toast.success("Ticket updated.");
      await utils.support.getAll.invalidate();
      if (selectedTicketId) {
        await utils.support.getById.invalidate({ ticketId: selectedTicketId });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AppLayout title="Support Inbox">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
          <h2 className="font-semibold text-foreground mb-4">Tickets</h2>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No support tickets yet.</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className="w-full text-left rounded-xl border border-border/60 p-3 hover:border-primary/30 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground capitalize">{ticket.category}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{ticket.status}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          {!selectedTicket ? (
            <div className="text-center py-20 text-muted-foreground">
              Select a support ticket to view and reply.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">{selectedTicket.subject}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{selectedTicket.category}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateStatus.mutate({ ticketId: selectedTicket.id, status: "open" })
                    }
                  >
                    Mark Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateStatus.mutate({ ticketId: selectedTicket.id, status: "closed" })
                    }
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl px-4 py-3 max-w-[85%] ${
                      msg.senderRole === "admin"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted border border-border/60"
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">
                      {msg.senderRole === "admin" ? "Admin" : "User"}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[11px] opacity-80 mt-2">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== "closed" && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Write a response..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={() => sendReply.mutate({ ticketId: selectedTicket.id, content: reply })}
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
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}