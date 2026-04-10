import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

const conn = await mysql.createConnection(DATABASE_URL);

try {
  console.log("Creating messages table...");
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id int AUTO_INCREMENT NOT NULL,
      jobId int NOT NULL,
      senderId int NOT NULL,
      content text NOT NULL,
      readBy varchar(1000) DEFAULT '[]',
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(id)
    )
  `);
  console.log("✓ Messages table created");

  console.log("Updating handyman_profiles categories column...");
  await conn.execute(`
    ALTER TABLE handyman_profiles MODIFY COLUMN categories varchar(1000) DEFAULT '[]'
  `);
  console.log("✓ Handyman profiles updated");

  console.log("✓ Migration complete");
} catch (err: any) {
  console.error("Migration error:", err.message);
  if (err.code !== "ER_TABLE_EXISTS_ERROR") throw err;
} finally {
  await conn.end();
}
