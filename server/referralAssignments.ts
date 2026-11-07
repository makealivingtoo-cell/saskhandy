import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import {
  handymanProfiles,
  users,
  referralAssignmentRestrictions,
} from "../drizzle/schema";
import {
  referralAccessStatuses,
  referralIneligibility,
} from "../shared/referralEligibility";
import { adminProcedure, router } from "./_core/trpc";

export const referralAssignmentsRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db
      .select({
        userId: users.id,
        userName: users.name,
        userType: users.userType,
        identityVerificationStatus: handymanProfiles.identityVerificationStatus,
        serviceArea: handymanProfiles.serviceArea,
        categories: handymanProfiles.categories,
        referralAccess: referralAssignmentRestrictions.status,
      })
      .from(users)
      .leftJoin(handymanProfiles, eq(users.id, handymanProfiles.userId))
      .leftJoin(
        referralAssignmentRestrictions,
        eq(users.id, referralAssignmentRestrictions.userId)
      );
    return rows.map(row => ({
      ...row,
      ineligibleReason: referralIneligibility(row),
    }));
  }),
  setAccess: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        status: z.enum(referralAccessStatuses),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.transaction(async tx => {
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, input.userId))
          .for("update");
        if (!user || user.userType !== "handyman")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Select a handyman account.",
          });
        await tx
          .insert(referralAssignmentRestrictions)
          .values({
            userId: user.id,
            status: input.status,
            updatedBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({
            set: { status: input.status, updatedBy: ctx.user.id },
          });
      });
      return { success: true };
    }),
});
