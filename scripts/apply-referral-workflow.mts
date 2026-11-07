import "dotenv/config";
import { createConnection } from "mysql2/promise";
import { readFileSync } from "node:fs";

// Explicit, additive migration. Never invoked by startup or build.
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const connection = await createConnection(process.env.DATABASE_URL);
try {
  await connection.execute(
    readFileSync(
      new URL("./sql/referral-workflow.sql", import.meta.url),
      "utf8"
    )
  );
  await connection.execute(
    readFileSync(
      new URL("./sql/referral-assignment-restrictions.sql", import.meta.url),
      "utf8"
    )
  );
  console.log(
    "Referral workflow table is ready. Existing referrals and quotes were not modified."
  );
} finally {
  await connection.end();
}
