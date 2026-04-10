import { eq, desc } from "drizzle-orm";
import { messages, Message, InsertMessage } from "../drizzle/schema";
import { getDb } from "./db";

export async function createMessage(data: InsertMessage): Promise<Message | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(messages).values(data);
  return getMessageById(result[0].insertId);
}

export async function getMessageById(id: number): Promise<Message | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getMessagesForJob(jobId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(eq(messages.jobId, jobId))
    .orderBy(desc(messages.createdAt));
}

export async function markMessageAsRead(messageId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const msg = await getMessageById(messageId);
  if (!msg) return;

  const readByArray = msg.readBy ? JSON.parse(msg.readBy) : [];
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
  if (!db) return 0;

  const jobMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.jobId, jobId));

  return jobMessages.filter((msg) => {
    const readByArray = msg.readBy ? JSON.parse(msg.readBy) : [];
    return !readByArray.includes(userId) && msg.senderId !== userId;
  }).length;
}
