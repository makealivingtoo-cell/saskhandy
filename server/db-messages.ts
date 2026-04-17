import { eq, desc } from "drizzle-orm";
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

export async function getMessagesForJob(jobId: number): Promise<Message[]> {
  const db = await getDb();

  return db
    .select()
    .from(messages)
    .where(eq(messages.jobId, jobId))
    .orderBy(desc(messages.createdAt));
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

  const jobMessages = await db.select().from(messages).where(eq(messages.jobId, jobId));

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