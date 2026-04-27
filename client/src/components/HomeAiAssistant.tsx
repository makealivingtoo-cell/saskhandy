import { useMemo, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const quickQuestions = [
  "How does SaskHandy work?",
  "What services can I request?",
  "How do handymen get jobs?",
  "How does payment work?",
];

function getAssistantReply(question: string) {
  const text = question.toLowerCase();

  if (
    text.includes("how") &&
    (text.includes("work") || text.includes("saskhandy"))
  ) {
    return "SaskHandy helps homeowners post home jobs, compare bids from local handymen, chat in one place, and pay securely after accepting a bid. You can start by creating an account and posting your first job.";
  }

  if (
    text.includes("service") ||
    text.includes("request") ||
    text.includes("job") ||
    text.includes("category")
  ) {
    return "You can request help with common home jobs like furniture assembly, TV mounting, drywall repair, painting, yard work, minor plumbing help, small electrical help, fence repair, and general home maintenance.";
  }

  if (
    text.includes("handyman") ||
    text.includes("handymen") ||
    text.includes("notification") ||
    text.includes("skills")
  ) {
    return "Handymen can sign up, select their skills, build a profile, and receive notifications when jobs matching their service categories are posted.";
  }

  if (
    text.includes("pay") ||
    text.includes("payment") ||
    text.includes("escrow") ||
    text.includes("money")
  ) {
    return "Payment is handled through SaskHandy after a homeowner accepts a bid. The goal is to keep job details, communication, and payment in one organized place.";
  }

  if (
    text.includes("saskatoon") ||
    text.includes("regina") ||
    text.includes("moose jaw") ||
    text.includes("warman") ||
    text.includes("martensville") ||
    text.includes("prince albert")
  ) {
    return "SaskHandy is built for Saskatchewan communities, including Saskatoon, Regina, Moose Jaw, Prince Albert, Warman, Martensville, and nearby areas.";
  }

  if (
    text.includes("start") ||
    text.includes("sign up") ||
    text.includes("account") ||
    text.includes("post")
  ) {
    return "To get started, create an account and choose whether you are a homeowner or handyman. Homeowners can post jobs, and handymen can select their skills and bid on matching jobs.";
  }

  return "I can help with questions about how SaskHandy works, what services homeowners can request, how handymen get jobs, payments, and getting started. Try asking something like: “How do I post a job?”";
}

export default function HomeAiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I can answer quick questions about SaskHandy, posting jobs, handyman services, payments, and getting started.",
    },
  ]);

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  const sendMessage = (value?: string) => {
    const message = (value ?? input).trim();

    if (!message) return;

    const reply = getAssistantReply(message);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: message },
      { role: "assistant", text: reply },
    ]);

    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-4 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-700 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <div>
                <div className="text-sm font-semibold">SaskHandy Assistant</div>
                <div className="text-xs text-emerald-50">Quick answers for homeowners</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/90 hover:bg-white/10"
              aria-label="Close assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto bg-[#f7faf8] px-4 py-4">
            {hasMessages &&
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-emerald-700 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Ask a question..."
                className="h-10"
              />

              <Button
                type="button"
                onClick={() => sendMessage()}
                className="h-10 rounded-full bg-emerald-700 px-4 hover:bg-emerald-800"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 text-center text-xs text-slate-500">
              Ready to begin?{" "}
              <Link href="/sign-up" className="font-semibold text-emerald-700 hover:underline">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl transition hover:bg-emerald-800"
        aria-label="Open SaskHandy assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}