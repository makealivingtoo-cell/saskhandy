# SaskHandy referral workflow — revised from the working phone-number build

Base commit: `0aa576a03fd5841467d9f84b7851c28b6dfe58f7` (`Display homeowner phone numbers in admin dashboard`).

## Changes

- Only handymen with `identityVerificationStatus='approved'` (ID Name Matched) show in the **new referral** picker. The server rechecks ID status while inserting in a transaction; changing ID status prevents subsequent new assignments. Existing assigned referrals are not reassigned or hidden.
- Admin recent referrals show the homeowner phone, a linked quote summary (if present), and a next-action hint. Quote approval and payment confirmation are different steps.
- Admin/handyman activity log records outreach, homeowner contacts, inspections and notes. Admin entries are private. Notes **never** send SMS/email, change an assignment, change a quote, or modify a payment.
- Existing 20% SaskHandy referral commission, private customer contact details before acceptance, homeowner quote links, taxes and Stripe payment flow are preserved.

## Database preparation — required before using Activity

The revised workflow adds **one** independent table. From the deployment using the revised code, run this once with `DATABASE_URL` set:

```bash
pnpm db:referral-workflow
```

The script is idempotent (`CREATE TABLE IF NOT EXISTS referral_workflow_events`) and does not alter any existing referral, quote or payment records. **Do not** run `pnpm db:push` to apply this change; this project has older Drizzle migration snapshots that need separate reconciliation.

Render is configured with an existing, very long pre-deploy command that prepares referral and quote tables. In the Render dashboard, append ` && pnpm db:referral-workflow` to the **end** of that existing command when deploying this revision. Do not remove the existing command; it still prepares legacy columns. Run the revised build only after the additive migration is ready. If the activity table is missing, the activity panel will display a clear loading error; existing referral and quote operations remain available.

Because Render auto-deploy has been disabled after the rollback, a new commit alone will **not** deploy. Once the code is committed and checked, deploy the intended revision explicitly.

## Suggested smoke tests before production use

1. Open Admin > Referrals and confirm only approved `ID Name Matched` handymen appear. Attempt selecting an unapproved user through a direct API call; server must reject it.
2. Check an existing referral; contact details, existing quote, and commission must still be present.
3. Open Activity; add an admin outreach note, refresh, and verify its persistence. Sign in as an assigned handyman: the admin note must not be visible.
4. Accept a test referral; add a contact or inspection note as the assigned handyman. An unrelated user must not access its history.
5. Send a test quote and check the summary. Test payment approval/settlement in Stripe **test mode only**; do not run live-payment tests on active jobs.

No database migration, deploy or live workflow test was performed while preparing this source package. Environment secrets, `.git`, `node_modules` and build artifacts are excluded from the shareable source package.
