import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  referralJobs,
  referralWorkflowEvents,
  quotes,
  users,
} from "../drizzle/schema";
import { workflowKinds, referralNextAction } from "../shared/referralWorkflow";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

async function workflowDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database unavailable.",
    });
  return db;
}

const enabled = () => process.env.REFERRAL_WORKFLOW_ENABLED === "true";
const workflowProcedure = protectedProcedure.use(({ next }) => {
  if (!enabled())
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Referral workflow is not enabled.",
    });
  return next();
});

export function assertWorkflowAccess(
  user: { id: number; role: string; userType?: string | null },
  referral: { handymanId: number; status: string }
) {
  if (user.role === "admin") return;
  if (
    user.userType !== "handyman" ||
    user.id !== referral.handymanId ||
    ["sent", "declined", "cancelled"].includes(referral.status)
  ) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

export const workflowEntryInput = z
  .object({
    referralJobId: z.number().int().positive(),
    kind: z.enum(workflowKinds),
    note: z.string().trim().max(2000).default(""),
    candidateId: z.number().int().positive().optional(),
    scheduledAt: z.date().optional(),
  })
  .superRefine((input, ctx) => {
    const outreach = ["outreach_sent", "interested", "unavailable"].includes(
      input.kind
    );
    if (outreach !== Boolean(input.candidateId))
      ctx.addIssue({
        code: "custom",
        message: "Select a handyman for outreach entries only.",
      });
    if ((input.kind === "visit_booked") !== Boolean(input.scheduledAt))
      ctx.addIssue({
        code: "custom",
        message: "A visit date is required for booked visits only.",
      });
    if (input.kind === "note" && !input.note)
      ctx.addIssue({ code: "custom", message: "Enter a note." });
  });

export const referralWorkflowRouter = router({
  config: protectedProcedure.query(() => ({ enabled: enabled() })),
  summary: workflowProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await workflowDb();
    const referrals = await db
      .select()
      .from(referralJobs)
      .orderBy(desc(referralJobs.updatedAt));
    const ids = referrals
      .filter(r => !["completed", "cancelled"].includes(r.status))
      .map(r => r.id);
    if (!ids.length) return [];
    const [events, linkedQuotes] = await Promise.all([
      db
        .select()
        .from(referralWorkflowEvents)
        .where(inArray(referralWorkflowEvents.referralJobId, ids)),
      db
        .select({
          id: quotes.id,
          referralJobId: quotes.referralJobId,
          status: quotes.status,
          expiresAt: quotes.expiresAt,
        })
        .from(quotes)
        .where(inArray(quotes.referralJobId, ids)),
    ]);
    return referrals
      .filter(r => ids.includes(r.id))
      .map(r => ({
        id: r.id,
        title: r.title,
        nextAction: referralNextAction(
          r.status,
          events.filter(e => e.referralJobId === r.id),
          linkedQuotes.filter(q => q.referralJobId === r.id)
        ),
      }))
      .filter(r => r.nextAction !== null);
  }),
  get: workflowProcedure
    .input(z.object({ referralJobId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await workflowDb();
      const [referral] = await db
        .select()
        .from(referralJobs)
        .where(eq(referralJobs.id, input.referralJobId));
      if (!referral) throw new TRPCError({ code: "NOT_FOUND" });
      assertWorkflowAccess(ctx.user, referral);
      const events = await db
        .select({
          id: referralWorkflowEvents.id,
          kind: referralWorkflowEvents.kind,
          note: referralWorkflowEvents.note,
          scheduledAt: referralWorkflowEvents.scheduledAt,
          createdAt: referralWorkflowEvents.createdAt,
          candidateId: referralWorkflowEvents.candidateId,
          candidateName: users.name,
        })
        .from(referralWorkflowEvents)
        .leftJoin(users, eq(users.id, referralWorkflowEvents.candidateId))
        .where(
          and(
            eq(referralWorkflowEvents.referralJobId, referral.id),
            ctx.user.role === "admin"
              ? undefined
              : and(
                  eq(referralWorkflowEvents.adminOnly, false),
                  eq(referralWorkflowEvents.actorId, ctx.user.id)
                )
          )
        )
        .orderBy(
          desc(referralWorkflowEvents.createdAt),
          desc(referralWorkflowEvents.id)
        );
      // Never expose public payment tokens, customer data, or Stripe identifiers here.
      const linkedQuotes = await db
        .select({
          id: quotes.id,
          status: quotes.status,
          totalAmount: quotes.totalAmount,
          expiresAt: quotes.expiresAt,
        })
        .from(quotes)
        .where(
          and(
            eq(quotes.referralJobId, referral.id),
            ctx.user.role === "admin"
              ? undefined
              : eq(quotes.handymanId, ctx.user.id)
          )
        )
        .orderBy(desc(quotes.id));
      return {
        events,
        quotes: linkedQuotes,
        nextAction: referralNextAction(referral.status, events, linkedQuotes),
        canUpdate: referral.status === "accepted",
      };
    }),
  add: workflowProcedure
    .input(workflowEntryInput)
    .mutation(async ({ ctx, input }) => {
      const db = await workflowDb();
      await db.transaction(async tx => {
        const [referral] = await tx
          .select()
          .from(referralJobs)
          .where(eq(referralJobs.id, input.referralJobId))
          .for("update");
        if (!referral) throw new TRPCError({ code: "NOT_FOUND" });
        assertWorkflowAccess(ctx.user, referral);
        const isAdmin = ctx.user.role === "admin";
        if (["completed", "cancelled"].includes(referral.status))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This referral is closed.",
          });
        if (
          !isAdmin &&
          (referral.status !== "accepted" ||
            !["customer_contacted", "visit_booked", "note"].includes(
              input.kind
            ))
        )
          throw new TRPCError({ code: "FORBIDDEN" });
        if (input.candidateId) {
          if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
          const [candidate] = await tx
            .select({ userType: users.userType })
            .from(users)
            .where(eq(users.id, input.candidateId));
          if (candidate?.userType !== "handyman")
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Select a valid handyman.",
            });
        }
        await tx.insert(referralWorkflowEvents).values({
          referralJobId: referral.id,
          actorId: ctx.user.id,
          kind: input.kind,
          note: input.note,
          candidateId: input.candidateId ?? null,
          scheduledAt: input.scheduledAt ?? null,
          adminOnly: isAdmin,
        });
      });
      return { success: true };
    }),
});
