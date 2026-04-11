import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send } from "lucide-react";
import { useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SupportTicketPage() {
  const { id } = useParams();
  const ticketId = parseInt(id ?? "0");
  const utils = trpc.useUtils();
  const [reply, setReply] = useState("");

  const { data: ticket, isLoading: ticketLoading } = trpc.support.getById.useQuery(
    { ticketId },
    { enabled: !!ticketId }
  );

  const { data: messages = [], isLoading: messagesLoading } = trpc.support.getMessages.useQuery(
    { ticketId },
    { enabled: !!ticketId }
  );

  const sendReply = trpc.support.reply.useMutation({
    onSuccess: async () => {
      setReply("");
      toast.success("Reply sent.");
      await utils.support.getMessages.invalidate({ ticketId });
      await utils.support.getMine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (ticketLoading || messagesLoading) {
    return (
      <AppLayout title="Support Ticket">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout title="Support Ticket">
        <div className="text-center py-20 text-muted-foreground">Ticket not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Support Ticket">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">{ticket.subject}</h2>
              <p className="text-sm text-muted-foreground capitalize">{ticket.category}</p>
            </div>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full capitalize">
              {ticket.status}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "rounded-xl px-4 py-3 max-w-[85%]",
                msg.senderRole === "admin"
                  ? "bg-muted border border-border/60"
                  : "bg-primary text-primary-foreground ml-auto"
              )}
            >
              <p className="text-xs font-medium mb-1">
                {msg.senderRole === "admin" ? "Support" : "You"}
              </p>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[11px] opacity-80 mt-2">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>

        {ticket.status !== "closed" && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-3">
            <Textarea
              placeholder="Write a reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
            />
            <Button
              onClick={() => sendReply.mutate({ ticketId, content: reply })}
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
                  Send Reply
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}