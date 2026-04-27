import { useMemo, useState } from "react";
import { MessageCircle, Send, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

export default function HomeAiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I can answer questions about SaskHandy, posting jobs, handyman services, payments, and getting started.",
    },
  ]);

  const askHomeAssistant = trpc.system.askHomeAssistant.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
        },
      ]);
    },
    onError: (err) => {
      toast.error(err.message || "Assistant failed. Please try again.");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I had trouble answering that. You can still sign up to post a job or browse SaskHandy services.",
        },
      ]);
    },
  });

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  const sendMessage = (value?: string) => {
    const message = (value ?? input).trim();

    if (!message || askHomeAssistant.isPending) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");

    askHomeAssistant.mutate({
      question: message,
    });
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
                <div className="text-xs text-emerald-50">Ask about SaskHandy</div>
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

            {askHomeAssistant.isPending && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  disabled={askHomeAssistant.isPending}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={askHomeAssistant.isPending}
              />

              <Button
                type="button"
                onClick={() => sendMessage()}
                disabled={askHomeAssistant.isPending || !input.trim()}
                className="h-10 rounded-full bg-emerald-700 px-4 hover:bg-emerald-800"
              >
                {askHomeAssistant.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
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