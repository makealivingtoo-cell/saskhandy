import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { supportTicketMessages, supportTickets } from "../drizzle/schema";

export async function createSupportTicket(params: {
  userId: number;
  subject: string;
  category: "general" | "payments" | "dispute" | "account" | "insurance" | "technical";
  content: string;
  jobId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(supportTickets).values({
    userId: params.userId,
    subject: params.subject,
    category: params.category,
    jobId: params.jobId,
    status: "open",
  });

  const ticketId = Number((result as any).insertId);

  await db.insert(supportTicketMessages).values({
    ticketId,
    senderId: params.userId,
    senderRole: "user",
    content: params.content,
  });

  return ticketId;
}

export async function getSupportTicketsForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.updatedAt));
}

export async function getAllSupportTickets() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt));
}

export async function getSupportTicketById(ticketId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getSupportTicketMessages(ticketId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(supportTicketMessages)
    .where(eq(supportTicketMessages.ticketId, ticketId))
    .orderBy(supportTicketMessages.createdAt);
}

export async function addSupportTicketMessage(params: {
  ticketId: number;
  senderId: number;
  senderRole: "user" | "admin";
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(supportTicketMessages).values({
    ticketId: params.ticketId,
    senderId: params.senderId,
    senderRole: params.senderRole,
    content: params.content,
  });

  await db
    .update(supportTickets)
    .set({
      status: params.senderRole === "admin" ? "replied" : "open",
    })
    .where(eq(supportTickets.id, params.ticketId));
}

export async function updateSupportTicketStatus(
  ticketId: number,
  status: "open" | "replied" | "closed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(supportTickets).set({ status }).where(eq(supportTickets.id, ticketId));
}