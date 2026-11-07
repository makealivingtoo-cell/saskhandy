import "dotenv/config";
import { createConnection } from "mysql2/promise";
import { readFileSync } from "node:fs";

// Explicit migration: must be run once before enabling the activity interface.
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await createConnection(process.env.DATABASE_URL);
try {
  const sql = readFileSync(new URL("./sql/referral-workflow.sql", import.meta.url), "utf8");
  await db.query(sql);
  console.log("Referral activity table is ready; existing jobs, quotes and payments are unchanged.");
} finally {
  await db.end();
}
