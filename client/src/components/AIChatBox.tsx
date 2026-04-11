import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Bot, ExternalLink, LifeBuoy, Loader2, MessageSquare, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type SupportCategory =
  | "general"
  | "payments"
  | "dispute"
  | "account"
  | "insurance"
  | "technical";

type ChatMessage =
  | {
      id: string;
      role: "assistant";
      text: string;
      links?: Array<{ label: string; href: string }>;
      faqTitle?: string;
    }
  | {
      id: string;
      role: "user";
      text: string;
    };

function inferCategory(text: string): SupportCategory {
  const q = text.toLowerCase();

  if (
    q.includes("payment") ||
    q.includes("pay") ||
    q.includes("card") ||
    q.includes("escrow") ||
    q.includes("refund") ||
    q.includes("payout")
  ) {
    return "payments";
  }

  if (
    q.includes("dispute") ||
    q.includes("issue with handyman") ||
    q.includes("issue with homeowner") ||
    q.includes("problem with job")
  ) {
    return "dispute";
  }

  if (
    q.includes("insurance") ||
    q.includes("verified") ||
    q.includes("certificate")
  ) {
    return "insurance";
  }

  if (
    q.includes("login") ||
    q.includes("account") ||
    q.includes("sign in") ||
    q.includes("sign up") ||
    q.includes("password")
  ) {
    return "account";
  }

  if (
    q.includes("bug") ||
    q.includes("error") ||
    q.includes("not working") ||
    q.includes("broken") ||
    q.includes("technical")
  ) {
    return "technical";
  }

  return "general";
}

function findFaqMatch(
  text: string,
  faqs: Array<{ id: string; title: string; answer: string }>
) {
  const q = text.toLowerCase();

  const faqMatchers: Array<{
    faqId: string;
    keywords: string[];
  }> = [
    {
      faqId: "payments",
      keywords: ["payment", "pay", "escrow", "refund", "payout"],
    },
    {
      faqId: "awaiting-payment",
      keywords: ["awaiting payment", "job awaiting", "payment pending", "accepted bid no payment"],
    },
    {
      faqId: "disputes",
      keywords: ["dispute", "issue", "problem", "complaint"],
    },
    {
      faqId: "insurance",
      keywords: ["insurance", "verified", "certificate"],
    },
    {
      faqId: "payouts",
      keywords: ["when do i get paid", "when paid", "handyman paid", "payout"],
    },
  ];

  for (const matcher of faqMatchers) {
    if (matcher.keywords.some((keyword) => q.includes(keyword))) {
      const faq = faqs.find((item) => item.id === matcher.faqId);
      if (faq) return faq;
    }
  }

  const semanticFallback = faqs.find((faq) => {
    const title = faq.title.toLowerCase();
    return q.split(" ").some((word) => word.length > 3 && title.includes(word));
  });

  return semanticFallback ?? null;
}

interface AIChatBoxProps {
  defaultPrompt?: string;
  title?: string;
  subtitle?: string;
}

export default function AIChatBox({
  defaultPrompt = "",
  title = "Support Assistant",
  subtitle = "Ask a quick question or create a support message.",
}: AIChatBoxProps) {
  const utils = trpc.useUtils();
  const { data: faqs = [], isLoading: faqsLoading } = trpc.support.getFaqs.useQuery();

  const [input, setInput] = useState(defaultPrompt);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Hi — I can help with payments, disputes, insurance verification, account issues, and general app questions. You can also send your message to support if you still need help.",
      links: [
        { label: "Open Support Page", href: "/support" },
        { label: "Open Messages", href: "/messages" },
      ],
    },
  ]);

  const createTicket = trpc.support.createTicket.useMutation({
    onSuccess: async (data, variables) => {
      toast.success("Support ticket created.");
      await utils.support.getMine.invalidate();

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-ticket-${data.ticketId}`,
          role: "assistant",
          text: `I created a support ticket for you under "${variables.subject}". You can open it below.`,
          links: [
            { label: "View Support Ticket", href: `/support/${data.ticketId}` },
            { label: "Open Support Page", href: "/support" },
          ],
        },
      ]);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const suggestedQuestions = useMemo(
    () => [
      "How do payments work?",
      "Why is my job awaiting payment?",
      "How do disputes work?",
      "What does insurance verified mean?",
      "I need help with a payment issue",
    ],
    []
  );

  const handleAsk = () => {
    const question = input.trim();
    if (!question) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: question,
    };

    const matchedFaq = findFaqMatch(question, faqs);

    let assistantMessage: ChatMessage;

    if (matchedFaq) {
      const links: Array<{ label: string; href: string }> = [{ label: "Open Support Page", href: "/support" }];

      if (matchedFaq.id === "payments" || matchedFaq.id === "awaiting-payment") {
        links.unshift({ label: "Open Messages", href: "/messages" });
      }

      assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        faqTitle: matchedFaq.title,
        text: matchedFaq.answer,
        links,
      };
    } else {
      assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          "I couldn't find a strong FAQ match for that. You can send this directly to support and the admin team will reply.",
        links: [
          { label: "Open Support Page", href: "/support" },
          { label: "Open Messages", href: "/messages" },
        ],
      };
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  const handleCreateTicketFromInput = () => {
    const content = input.trim();
    if (content.length < 10) {
      toast.error("Please enter a bit more detail first.");
      return;
    }

    createTicket.mutate({
      subject: content.length > 60 ? `${content.slice(0, 60)}...` : content,
      category: inferCategory(content),
      content,
    });
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestedQuestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => handleSuggestedQuestion(question)}
            className="text-xs rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3 max-h-[420px] overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-3"
                : "max-w-[85%] rounded-2xl bg-white border border-border/60 px-4 py-3"
            }
          >
            {message.role === "assistant" && message.faqTitle && (
              <p className="text-xs font-medium text-primary mb-1">{message.faqTitle}</p>
            )}

            <p className="text-sm whitespace-pre-wrap">{message.text}</p>

            {message.role === "assistant" && message.links && message.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {message.links.map((link) => (
                  <Link key={`${message.id}-${link.href}-${link.label}`} href={link.href}>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer">
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {faqsLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading support help...
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Ask about payments, disputes, insurance, or account issues..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAsk();
            }
          }}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAsk}
            disabled={!input.trim() || faqsLoading}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Ask Assistant
          </Button>

          <Button
            variant="outline"
            onClick={handleCreateTicketFromInput}
            disabled={createTicket.isPending || !input.trim()}
            className="flex-1"
          >
            {createTicket.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LifeBuoy className="w-4 h-4 mr-2" />
            )}
            Send to Support
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <Link href="/support">
            <span className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer">
              <LifeBuoy className="w-3.5 h-3.5" />
              Open Support
            </span>
          </Link>

          <Link href="/messages">
            <span className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5" />
              Open Messages
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}