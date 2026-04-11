import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobChatProps {
  jobId: number;
  otherPartyLabel: string;
}

export function JobChat({ jobId, otherPartyLabel }: JobChatProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const messagesQuery = trpc.messages.getForJob.useQuery(
    { jobId },
    {
      refetchInterval: 4000,
      refetchOnWindowFocus: true,
    }
  );

  const sendMessage = trpc.messages.create.useMutation({
    onSuccess: async () => {
      setMessage("");
      await utils.messages.getForJob.invalidate({ jobId });
      await utils.messages.getUnreadCount.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const groupedMessages = useMemo(() => messages, [messages]);

  const handleSend = () => {
    const content = message.trim();
    if (!content) return;

    sendMessage.mutate({
      jobId,
      content,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-border/40">
        <h3 className="font-semibold text-foreground">Chat</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Message {otherPartyLabel} about this job.
        </p>
      </div>

      {messagesQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : groupedMessages.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start the conversation with {otherPartyLabel}.
          </p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
          {groupedMessages.map((msg) => {
            const isMine = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-white border border-border/60 text-foreground"
                  )}
                >
                  {!isMine && (
                    <p className="text-[11px] font-medium mb-1 opacity-80">
                      {msg.senderName ?? otherPartyLabel}
                    </p>
                  )}

                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>

                  <p
                    className={cn(
                      "text-[10px] mt-2",
                      isMine ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                    title={format(new Date(msg.createdAt), "MMM d, yyyy h:mm a")}
                  >
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="border-t border-border/40 p-4">
        <div className="space-y-3">
          <Textarea
            placeholder={`Write a message to ${otherPartyLabel}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sendMessage.isPending || !message.trim()}>
              {sendMessage.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}