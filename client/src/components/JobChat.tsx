import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

type JobChatProps = {
  jobId: number;
  otherPartyLabel?: string;
};

export function JobChat({ jobId, otherPartyLabel = "the other person" }: JobChatProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");

  const { data: messages, isLoading } = trpc.messages.getForJob.useQuery(
    { jobId },
    {
      enabled: !!jobId,
      refetchInterval: 15000,
    }
  );

  const createMessage = trpc.messages.create.useMutation({
    onSuccess: async () => {
      setContent("");
      await utils.messages.getForJob.invalidate({ jobId });
      await utils.messages.getUnreadCount.invalidate({ jobId });
    },
    onError: (err) => toast.error(err.message),
  });

  const sortedMessages = useMemo(() => {
    return [...(messages ?? [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    createMessage.mutate({ jobId, content: trimmed });
  };

  return (
    <div className="bg-white rounded-xl border border-border/60 p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Job chat</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send updates, questions, and scheduling details to {otherPartyLabel}.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : sortedMessages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center bg-muted/20">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start the conversation with {otherPartyLabel} here.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-3">
            {sortedMessages.map((message) => {
              const isMine = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn("flex", isMine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 border",
                      isMine
                        ? "bg-primary text-primary-foreground border-primary/80"
                        : "bg-muted/30 border-border/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className={cn("text-xs font-medium", isMine ? "text-primary-foreground/90" : "text-muted-foreground")}>
                        {isMine ? "You" : message.senderName ?? otherPartyLabel}
                      </p>
                      <span className={cn("text-[11px]", isMine ? "text-primary-foreground/80" : "text-muted-foreground") }>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn("text-sm whitespace-pre-wrap break-words", isMine ? "text-primary-foreground" : "text-foreground")}>
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <div className="mt-4 space-y-3">
        <Textarea
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={2000}
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Keep messages work-related and clear.</p>
          <Button onClick={handleSend} disabled={!content.trim() || createMessage.isPending}>
            {createMessage.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
