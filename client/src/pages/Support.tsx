import { useAuth } from "@/_core/hooks/useAuth";
import AIChatBox from "@/components/AIChatBox";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, LifeBuoy, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type SupportCategory =
  | "general"
  | "payments"
  | "dispute"
  | "account"
  | "insurance"
  | "technical";

export default function SupportPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: faqs = [] } = trpc.support.getFaqs.useQuery();
  const { data: tickets = [], isLoading } = trpc.support.getMine.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("general");
  const [content, setContent] = useState("");

  const createTicket = trpc.support.createTicket.useMutation({
    onSuccess: async () => {
      toast.success("Support message sent.");
      setSubject("");
      setCategory("general");
      setContent("");
      await utils.support.getMine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AppLayout title="Support">
      <div className="max-w-3xl mx-auto space-y-6">
        <AIChatBox />

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <LifeBuoy className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-xl border border-border/60 p-4">
                <p className="text-sm font-medium text-foreground mb-1">{faq.title}</p>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Still need help?</h2>

          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Select value={category} onValueChange={(value) => setCategory(value as SupportCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="dispute">Dispute</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Describe your issue..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />

          <Button
            onClick={() => createTicket.mutate({ subject, category, content })}
            disabled={createTicket.isPending || subject.trim().length < 3 || content.trim().length < 10}
          >
            {createTicket.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Support Message"
            )}
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Your Support Tickets</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No support tickets yet.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/support/${ticket.id}`}>
                  <div className="rounded-xl border border-border/60 p-4 hover:border-primary/30 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ticket.category}</p>
                      </div>
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full capitalize">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}