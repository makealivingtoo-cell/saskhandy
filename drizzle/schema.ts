import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["homeowner", "handyman", "unset"]).default("unset").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Handyman Profiles ────────────────────────────────────────────────────────
export const handymanProfiles = mysqlTable("handyman_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bio: text("bio"),
  categories: varchar("categories", { length: 1000 }).default("[]"),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalJobs: int("totalJobs").default(0).notNull(),
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0.00"),
  verified: boolean("verified").default(false).notNull(),
  backgroundCheckPassed: boolean("backgroundCheckPassed").default(false).notNull(),
  insuranceVerified: boolean("insuranceVerified").default(false).notNull(),
  insuranceCertUrl: text("insuranceCertUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HandymanProfile = typeof handymanProfiles.$inferSelect;
export type InsertHandymanProfile = typeof handymanProfiles.$inferInsert;

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  homeownerId: int("homeownerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  budgetMin: decimal("budgetMin", { precision: 10, scale: 2 }),
  budgetMax: decimal("budgetMax", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "disputed", "cancelled"])
    .default("open")
    .notNull(),
  selectedHandymanId: int("selectedHandymanId"),
  selectedBidId: int("selectedBidId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// ─── Bids ─────────────────────────────────────────────────────────────────────
export const bids = mysqlTable("bids", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  handymanId: int("handymanId").notNull(),
  bidAmount: decimal("bidAmount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  availability: varchar("availability", { length: 255 }),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "cancelled"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

// ─── Payments (Escrow) ────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  homeownerId: int("homeownerId").notNull(),
  handymanId: int("handymanId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(),
  handymanPayout: decimal("handymanPayout", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeTransferId: varchar("stripeTransferId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  reviewerId: int("reviewerId").notNull(),
  revieweeId: int("revieweeId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Disputes ─────────────────────────────────────────────────────────────────
export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  initiatedBy: int("initiatedBy").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["open", "resolved_release", "resolved_refund"])
    .default("open")
    .notNull(),
  adminNotes: text("adminNotes"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

// ─── Messages (Job Chat) ──────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  readBy: varchar("readBy", { length: 1000 }).default("[]"), // JSON array of user IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
