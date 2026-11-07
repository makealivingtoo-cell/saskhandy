import "dotenv/config";
import { createConnection, type RowDataPacket } from "mysql2/promise";
import { readFileSync } from "node:fs";

// Non-destructive, repeatable migration for both legacy and current referral activity tables.
// This must run after the existing referral/quotes pre-deploy initialization.
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

type Column = RowDataPacket & {
  COLUMN_NAME: string;
  IS_NULLABLE: "YES" | "NO";
  COLUMN_TYPE: string;
};

const db = await createConnection(process.env.DATABASE_URL);
try {
  const sql = readFileSync(new URL("./sql/referral-workflow.sql", import.meta.url), "utf8");
  await db.query(sql);

  const [rows] = await db.query<Column[]>(
    `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'referral_workflow_events'`
  );
  const columns = new Map(rows.map((column) => [column.COLUMN_NAME, column]));
  if (!columns.has("id") || !columns.has("referralJobId") || !columns.has("note")) {
    throw new Error("Unexpected referral activity table schema; migration stopped safely.");
  }

  // The initial workflow used actorId/kind/scheduledAt/adminOnly. CREATE TABLE
  // IF NOT EXISTS cannot update it, so add revised columns without dropping any data.
  const missingColumns: Array<[string, string]> = [
    ["actorUserId", "INT NULL"],
    ["type", "ENUM('outreach','contacted','inspection','note') NULL"],
    ["scheduledFor", "TIMESTAMP NULL"],
    // Keep NULL for backfill; DEFAULT 0 would accidentally expose old private notes.
    ["privateToAdmin", "TINYINT(1) NULL"],
  ];
  for (const [name, definition] of missingColumns) {
    if (!columns.has(name)) {
      await db.query(`ALTER TABLE \`referral_workflow_events\` ADD COLUMN \`${name}\` ${definition}`);
      console.log(`Added referral_workflow_events.${name}`);
    }
  }

  if (columns.has("actorId")) {
    await db.query(
      "UPDATE `referral_workflow_events` SET `actorUserId` = `actorId` WHERE `actorUserId` IS NULL"
    );
  }
  if (columns.has("kind")) {
    await db.query(
      `UPDATE \`referral_workflow_events\` SET \`type\` = CASE \`kind\`
         WHEN 'customer_contacted' THEN 'contacted'
         WHEN 'visit_booked' THEN 'inspection'
         WHEN 'outreach_sent' THEN 'outreach'
         WHEN 'interested' THEN 'outreach'
         WHEN 'unavailable' THEN 'outreach'
         ELSE 'note' END
       WHERE \`type\` IS NULL`
    );
  }
  if (columns.has("scheduledAt")) {
    await db.query(
      "UPDATE `referral_workflow_events` SET `scheduledFor` = `scheduledAt` WHERE `scheduledFor` IS NULL AND `scheduledAt` IS NOT NULL"
    );
  }
  // Preserve privacy of all older admin-only entries.
  if (columns.has("adminOnly")) {
    await db.query(
      "UPDATE `referral_workflow_events` SET `privateToAdmin` = `adminOnly` WHERE `privateToAdmin` IS NULL"
    );
  } else {
    await db.query(
      "UPDATE `referral_workflow_events` SET `privateToAdmin` = 1 WHERE `privateToAdmin` IS NULL"
    );
  }

  const [unfilled] = await db.query<Array<RowDataPacket & { n: number }>>(
    "SELECT COUNT(*) AS n FROM `referral_workflow_events` WHERE `actorUserId` IS NULL OR `type` IS NULL OR `privateToAdmin` IS NULL"
  );
  if (Number(unfilled[0]?.n ?? 0) > 0) {
    throw new Error("Unmigrated referral activity entries remain. No existing entries were removed.");
  }

  // Keep legacy columns and data, but let new records omit old fields.
  if (columns.get("actorId")?.IS_NULLABLE === "NO") {
    await db.query("ALTER TABLE `referral_workflow_events` MODIFY COLUMN `actorId` INT NULL");
  }
  if (columns.get("kind")?.IS_NULLABLE === "NO") {
    const kindDefinition = columns.get("kind")!.COLUMN_TYPE;
    if (!/^enum\('[a-z_]+'(?:,'[a-z_]+')*\)$/i.test(kindDefinition)) {
      throw new Error("Unexpected legacy activity kind definition; migration stopped safely.");
    }
    await db.query(`ALTER TABLE \`referral_workflow_events\` MODIFY COLUMN \`kind\` ${kindDefinition} NULL`);
  }

  if (!columns.has("actorUserId")) {
    await db.query("ALTER TABLE `referral_workflow_events` MODIFY COLUMN `actorUserId` INT NOT NULL");
  }
  if (!columns.has("type")) {
    await db.query("ALTER TABLE `referral_workflow_events` MODIFY COLUMN `type` ENUM('outreach','contacted','inspection','note') NOT NULL");
  }
  if (!columns.has("privateToAdmin")) {
    await db.query("ALTER TABLE `referral_workflow_events` MODIFY COLUMN `privateToAdmin` TINYINT(1) NOT NULL DEFAULT 0");
  }

  // Verify the exact selection used by the activity panels.
  await db.query(
    "SELECT `id`, `referralJobId`, `actorUserId`, `type`, `note`, `scheduledFor`, `privateToAdmin`, `createdAt` FROM `referral_workflow_events` WHERE `referralJobId` = ? ORDER BY `createdAt` DESC, `id` DESC LIMIT 0",
    [0]
  );
  console.log("Referral activity schema ready, including legacy-column reconciliation; existing jobs, quotes and payments unchanged.");
} finally {
  await db.end();
}
