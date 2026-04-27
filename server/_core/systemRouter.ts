import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./trpc";
import { invokeLLM } from "./llm";

const JOB_CATEGORIES = [
  "General Helper",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "HVAC",
  "Landscaping",
  "Cleaning",
  "Drywall",
  "Roofing",
] as const;

type ImproveJobPostResult = {
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  followUpQuestions: string[];
};

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    const textParts = content
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: string }).type === "text" &&
          "text" in part
        ) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .filter(Boolean);

    return textParts.join("\n");
  }

  return "";
}

function normalizeCategory(category: string): string {
  const matched = JOB_CATEGORIES.find(
    (item) => item.toLowerCase() === category.trim().toLowerCase()
  );
  return matched ?? "General Helper";
}

function normalizeBudget(value: unknown, fallback: number): number {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? parseFloat(value)
      : NaN;

  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.round(num);
}

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  askHomeAssistant: publicProcedure
    .input(
      z.object({
        question: z.string().min(2, "Please ask a question").max(500),
      })
    )
    .mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are SaskHandy's website assistant.

SaskHandy is a Saskatchewan handyman marketplace that helps homeowners post home jobs, compare bids from local handymen, chat in one place, and pay securely.

Answer questions about SaskHandy only.

Core facts:
- SaskHandy helps homeowners post home repair and maintenance jobs.
- Homeowners can compare bids from local handymen.
- Homeowners and handymen can chat through the platform.
- Payments are handled through SaskHandy after a homeowner accepts a bid.
- Funds are held until the job is complete.
- Handymen can sign up, select their skills, build a profile, and get notified when jobs match their skills.
- SaskHandy serves Saskatchewan communities including Saskatoon, Regina, Moose Jaw, Prince Albert, Warman, Martensville, and nearby areas.
- Common job categories include furniture assembly, TV mounting, plumbing help, electrical help, yard work, painting, drywall repair, home repairs, moving help, seasonal maintenance, fence repair, gutter cleaning, and general handyman work.
- For complex plumbing, electrical, structural, gas, roofing, unsafe, emergency, or permit-related work, tell users to contact a qualified/licensed professional.
- Do not provide repair instructions for dangerous jobs.
- Do not make promises about guaranteed availability, guaranteed pricing, or guaranteed outcomes.
- Keep answers short, friendly, and useful.
- When relevant, encourage homeowners to sign up and post a job.
- When relevant, encourage handymen to sign up, select skills, and complete their profile.

If the user asks something unrelated to SaskHandy, politely redirect them back to SaskHandy, home jobs, posting a job, becoming a handyman, services, locations, or payments.`,
          },
          {
            role: "user",
            content: input.question.trim(),
          },
        ],
      });

      const answer = extractTextContent(result.choices?.[0]?.message?.content).trim();

      if (!answer) {
        throw new Error("AI assistant returned an empty response");
      }

      return {
        answer,
      };
    }),

  improveJobPost: protectedProcedure
    .input(
      z.object({
        roughIdea: z.string().min(10, "Please provide a bit more detail"),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const locationText = input.location?.trim()
        ? `\nLocation: ${input.location.trim()}`
        : "";

      const categoryList = JOB_CATEGORIES.join(", ");

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You help homeowners create better handyman job posts for a Canadian marketplace called SaskHandy.

Return practical, concise, trustworthy output.
Choose exactly one category from this list:
${categoryList}

Rules:
- Title should be short and clear.
- Description should be specific and useful for a handyman preparing a bid.
- Budget should be realistic for the described work.
- Do not invent dangerous repair instructions.
- Follow-up questions should help the homeowner improve the post.`,
          },
          {
            role: "user",
            content: `Turn this rough homeowner request into a polished job post.${locationText}

Request:
${input.roughIdea}`,
          },
        ],
        outputSchema: {
          name: "improve_job_post",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              category: {
                type: "string",
                enum: [...JOB_CATEGORIES],
              },
              budgetMin: { type: "number" },
              budgetMax: { type: "number" },
              followUpQuestions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "title",
              "description",
              "category",
              "budgetMin",
              "budgetMax",
              "followUpQuestions",
            ],
          },
        },
      });

      const rawContent = extractTextContent(result.choices?.[0]?.message?.content);
      if (!rawContent) {
        throw new Error("AI returned an empty response");
      }

      let parsed: Partial<ImproveJobPostResult>;
      try {
        parsed = JSON.parse(rawContent) as Partial<ImproveJobPostResult>;
      } catch {
        throw new Error("AI returned invalid structured output");
      }

      const budgetMin = normalizeBudget(parsed.budgetMin, 100);
      const budgetMax = normalizeBudget(parsed.budgetMax, Math.max(budgetMin + 50, 200));

      return {
        title: (parsed.title ?? "").trim(),
        description: (parsed.description ?? "").trim(),
        category: normalizeCategory(parsed.category ?? "General Helper"),
        budgetMin,
        budgetMax: budgetMax < budgetMin ? budgetMin + 50 : budgetMax,
        followUpQuestions: Array.isArray(parsed.followUpQuestions)
          ? parsed.followUpQuestions
              .map((item) => String(item).trim())
              .filter(Boolean)
              .slice(0, 5)
          : [],
      };
    }),
});