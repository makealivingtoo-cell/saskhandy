import "dotenv/config";
import { getAllUsers } from "./db";
import { syncUserToBrevo } from "../brevo";

async function main() {
  const users = await getAllUsers();

  const eligibleUsers = users.filter(
    (user) =>
      user.email &&
      (user.userType === "homeowner" || user.userType === "handyman")
  );

  console.log(`[Brevo Backfill] Found ${eligibleUsers.length} eligible users`);

  let successCount = 0;
  let failCount = 0;

  for (const user of eligibleUsers) {
    try {
      await syncUserToBrevo({
        email: user.email!,
        name: user.name,
        userType: user.userType as "homeowner" | "handyman",
        marketingOptIn: user.marketingOptIn,
      });

      successCount += 1;
      console.log(
        `[Brevo Backfill] Synced ${user.email} (${user.userType})`
      );
    } catch (error: any) {
      failCount += 1;
      console.error(
        `[Brevo Backfill] Failed for ${user.email}:`,
        error?.message ?? error
      );
    }
  }

  console.log(
    `[Brevo Backfill] Done. Success: ${successCount}, Failed: ${failCount}`
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Brevo Backfill] Fatal error:", error);
    process.exit(1);
  });