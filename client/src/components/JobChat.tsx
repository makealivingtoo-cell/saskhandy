import { useAuth } from "@/_core/hooks/useAuth";
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
  includeJobThread?: boolean;
  paymentPending?: boolean;
  jobStatus?: "open" | "awaiting_payment" | "in_progress" | "completed" | "disputed" | "cancelled";
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
  includeJobThread = false,
  paymentPending = false,
  jobStatus,
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
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const queryInput = bidId
    ? { jobId, bidId, includeJobThread }
    : { jobId, includeJobThread };

  const messagesQuery = trpc.messages.getForJob.useQuery(queryInput, {
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });

  const sendMessage = trpc.messages.create.useMutation({
    onSuccess: async () => {
      setMessage("");

      await utils.messages.getForJob.invalidate(queryInput);
      await utils.messages.getUnreadCount.invalidate(
        bidId ? { jobId, bidId } : { jobId }
      );

      requestAnimationFrame(() => composerRef.current?.focus());
    },
    onError: (err) => toast.error(err.message),
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [message]);

  const groupedMessages = useMemo(() => messages, [messages]);

  const isHandyman = user?.userType === "handyman";

  const coordinationCopy = useMemo(() => {
    if (jobStatus === "awaiting_payment") {
      return isHandyman
        ? {
            title: "Agree on timing while payment is pending",
            body: "You can confirm availability now, but wait until payment is secured before starting work.",
          }
        : {
            title: "Confirm availability while you finish payment",
            body: "You can agree on a likely time now. Work should only start after SaskHandy confirms payment is secured.",
          };
    }

    if (jobStatus === "in_progress") {
      return isHandyman
        ? {
            title: "Coordinate the visit here",
            body: "Confirm arrival time, access and materials. Send a quick update when you are on the way and when the work is ready to review.",
          }
        : {
            title: "Keep the visit details in one place",
            body: "Confirm arrival time, access and anything that needs to be ready. Check the work before marking the job complete.",
          };
    }

    if (jobStatus === "completed") {
      return {
        title: "Job complete",
        body: "Keep any final questions or follow-up notes in this conversation so the job history stays together.",
      };
    }

    return null;
  }, [isHandyman, jobStatus]);

  const quickPrompts = useMemo(() => {
    if (jobStatus === "awaiting_payment") {
      return isHandyman
        ? [
            "Thanks — I’m available once payment is secured.",
            "What day and time works best for you?",
          ]
        : [
            "I’m completing payment now.",
            "What day and time works best for you?",
          ];
    }

    if (jobStatus === "in_progress") {
      return isHandyman
        ? [
            "What arrival time works best for you?",
            "I’m on my way.",
            "I’ve arrived.",
            "The work is ready for you to check.",
          ]
        : [
            "What time should I expect you?",
            "Please message me when you’re on the way.",
            "Do I need to have anything ready?",
          ];
    }

    return [];
  }, [isHandyman, jobStatus]);

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
      <div
        className={cn(
          "border-b border-border/40 shrink-0",
          compact ? "px-4 py-2.5" : "px-5 py-4"
        )}
      >
        <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
          {title}
        </h3>
        <p
          className={cn(
            "text-muted-foreground mt-0.5",
            compact ? "text-[11px] line-clamp-1" : "text-xs"
          )}
        >
          {description ?? `Message ${otherPartyLabel} about this job.`}
        </p>
      </div>

      {paymentPending && !compact && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-amber-800">
              Payment is pending. Payment is held securely through SaskHandy and is not released
              to the handyman until the homeowner marks the job complete.
            </p>
          </div>
        </div>
      )}

      {coordinationCopy && !compact && (
        <div className="border-b border-primary/10 bg-primary/[0.035] px-5 py-3">
          <p className="text-xs font-semibold text-foreground">{coordinationCopy.title}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5">
            {coordinationCopy.body}
          </p>
        </div>
      )}

      {messagesQuery.isLoading ? (
        <div
          className={cn(
            "flex items-center justify-center flex-1 min-h-0",
            compact ? "py-4" : "py-8"
          )}
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : groupedMessages.length === 0 ? (
        <div
          className={cn(
            "text-center flex-1 min-h-0 flex flex-col items-center justify-center",
            compact ? "px-4 py-4" : "px-6 py-6"
          )}
        >
          <MessageSquare
            className={cn("text-muted-foreground mx-auto mb-2", compact ? "w-6 h-6" : "w-8 h-8")}
          />
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
              <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
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

      <div
        className={cn(
          "border-t border-border/40 shrink-0 bg-white",
          compact ? "px-2.5 py-2" : "px-3 py-3 sm:px-4"
        )}
      >
        {!compact && quickPrompts.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setMessage(prompt);
                  requestAnimationFrame(() => composerRef.current?.focus());
                }}
                className="shrink-0 rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-primary/5"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 rounded-[24px] border border-border/70 bg-muted/20 shadow-sm transition-colors focus-within:border-primary/55 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
            <textarea
              ref={composerRef}
              aria-label={`Message ${otherPartyLabel}`}
              placeholder={`Message ${otherPartyLabel}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={1}
              className="block max-h-28 min-h-11 w-full resize-none overflow-y-auto bg-transparent px-4 py-[10px] text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
              onFocus={() => {
                window.setTimeout(() => {
                  composerRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 250);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <button
            type="button"
            aria-label="Send message"
            title="Send message"
            onClick={handleSend}
            disabled={sendMessage.isPending || !message.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all enabled:hover:bg-primary/90 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 translate-x-[1px]" />
            )}
          </button>
        </div>

        {!compact && (
          <div className="mt-1.5 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
            <Shield className="h-3 w-3 shrink-0 text-primary/70" />
            <span>Keep job communication on SaskHandy for protection.</span>
          </div>
        )}
      </div>
    </div>
  );
}