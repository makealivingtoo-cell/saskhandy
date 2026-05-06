import { and, asc, eq, isNull } from "drizzle-orm";
import { messages, type Message, type InsertMessage } from "../drizzle/schema";
import { getDb } from "./db";

export async function createMessage(data: InsertMessage): Promise<Message | null> {
  const db = await getDb();

  const result = await db.insert(messages).values(data);
  const insertId = Number((result as any).insertId);

  if (!insertId) {
    return null;
  }

  return getMessageById(insertId);
}

export async function getMessageById(id: number): Promise<Message | null> {
  const db = await getDb();

  const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Legacy job-level messages.
 * Keep this for accepted-job chats and backwards compatibility.
 * Important: only return messages that are NOT attached to a bid.
 */
export async function getMessagesForJob(jobId: number): Promise<Message[]> {
  const db = await getDb();

  return db
    .select()
    .from(messages)
    .where(and(eq(messages.jobId, jobId), isNull(messages.bidId)))
    .orderBy(asc(messages.createdAt));
}

/**
 * Bid-level messages.
 * This keeps pre-acceptance conversations private between:
 * - the homeowner
 * - the handyman who placed that specific bid
 */
export async function getMessagesForBid(jobId: number, bidId: number): Promise<Message[]> {
  const db = await getDb();

  return db
    .select()
    .from(messages)
    .where(and(eq(messages.jobId, jobId), eq(messages.bidId, bidId)))
    .orderBy(asc(messages.createdAt));
}

export async function markMessageAsRead(messageId: number, userId: number): Promise<void> {
  const db = await getDb();

  const msg = await getMessageById(messageId);
  if (!msg) return;

  let readByArray: number[] = [];

  try {
    readByArray = msg.readBy ? JSON.parse(msg.readBy) : [];
  } catch {
    readByArray = [];
  }

  if (!readByArray.includes(userId)) {
    readByArray.push(userId);
  }

  await db
    .update(messages)
    .set({ readBy: JSON.stringify(readByArray) })
    .where(eq(messages.id, messageId));
}

export async function getUnreadCount(jobId: number, userId: number): Promise<number> {
  const db = await getDb();

  const jobMessages = await db
    .select()
    .from(messages)
    .where(and(eq(messages.jobId, jobId), isNull(messages.bidId)));

  return jobMessages.filter((msg) => {
    let readByArray: number[] = [];

    try {
      readByArray = msg.readBy ? JSON.parse(msg.readBy) : [];
    } catch {
      readByArray = [];
    }

    return !readByArray.includes(userId) && msg.senderId !== userId;
  }).length;
}

export async function getUnreadCountForBid(
  jobId: number,
  bidId: number,
  userId: number
): Promise<number> {
  const db = await getDb();

  const bidMessages = await db
    .select()
    .from(messages)
    .where(and(eq(messages.jobId, jobId), eq(messages.bidId, bidId)));

  return bidMessages.filter((msg) => {
    let readByArray: number[] = [];

    try {
      readByArray = msg.readBy ? JSON.parse(msg.readBy) : [];
    } catch {
      readByArray = [];
    }

    return !readByArray.includes(userId) && msg.senderId !== userId;
  }).length;
}