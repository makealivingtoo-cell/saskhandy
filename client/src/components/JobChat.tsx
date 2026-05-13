import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Send, Shield } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobChatProps {
  jobId: number;
  otherPartyLabel: string;
  bidId?: number;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

const restrictedContactPattern =
  /(\+?\d[\d\s().-]{7,}\d)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(whatsapp|text me|call me|phone number|phone #|email me|e-transfer|etransfer|cash only|pay cash|outside saskhandy)/i;

function containsRestrictedContactInfo(value: string) {
  return restrictedContactPattern.test(value);
}

export function JobChat({
  jobId,
  bidId,
  otherPartyLabel,
  title = "Chat",
  description,
  compact = false,
  className,
}: JobChatProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const queryInput = bidId ? { jobId, bidId } : { jobId };

  const messagesQuery = trpc.messages.getForJob.useQuery(queryInput, {
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });

  const sendMessage = trpc.messages.create.useMutation({
    onSuccess: async () => {
      setMessage("");

      await utils.messages.getForJob.invalidate(queryInput);
      await utils.messages.getUnreadCount.invalidate(queryInput);
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

    if (containsRestrictedContactInfo(content)) {
      toast.error(
        "Please keep contact details and payment communication inside SaskHandy for safety and payment protection."
      );
      return;
    }

    sendMessage.mutate({
      jobId,
      bidId,
      content,
    });
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden",
        compact ? "h-full min-h-0 flex flex-col" : "mt-6",
        className
      )}
    >
      <div className={cn("border-b border-border/40 shrink-0", compact ? "px-4 py-2.5" : "px-5 py-4")}>
        <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>{title}</h3>
        <p className={cn("text-muted-foreground mt-0.5", compact ? "text-[11px] line-clamp-1" : "text-xs")}>
          {description ?? `Message ${otherPartyLabel} about this job.`}
        </p>
      </div>

      {messagesQuery.isLoading ? (
        <div className={cn("flex items-center justify-center flex-1 min-h-0", compact ? "py-4" : "py-8")}>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : groupedMessages.length === 0 ? (
        <div className={cn("text-center flex-1 min-h-0 flex flex-col items-center justify-center", compact ? "px-4 py-4" : "px-6 py-6")}>
          <MessageSquare className={cn("text-muted-foreground mx-auto mb-2", compact ? "w-6 h-6" : "w-8 h-8")} />
          <p className="text-sm font-medium text-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start the conversation with {otherPartyLabel}.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "overflow-y-auto bg-muted/20 flex-1",
            compact ? "min-h-0 px-3 py-3 space-y-2" : "max-h-[420px] px-4 py-4 space-y-3"
          )}
        >
          {groupedMessages.map((msg) => {
            const isMine = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-3 shadow-sm",
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

      <div className={cn("border-t border-border/40 shrink-0", compact ? "p-2.5" : "p-4")}>
        {!compact && (
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/15 px-3 py-2">
            <Shield className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Keep messages, contact details, and payment communication on SaskHandy for safety,
              payment protection, and dispute support.
            </p>
          </div>
        )}

        <div className={cn(compact ? "space-y-2" : "space-y-3")}>
          <Textarea
            placeholder={`Write a message to ${otherPartyLabel}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={compact ? 1 : 3}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              {compact ? "Stay on SaskHandy for safety" : "Press Ctrl + Enter to send"}
            </p>

            <Button size={compact ? "sm" : "default"} onClick={handleSend} disabled={sendMessage.isPending || !message.trim()}>
              {sendMessage.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}