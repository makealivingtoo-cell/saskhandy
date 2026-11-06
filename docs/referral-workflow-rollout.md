# Referral workflow tracking: first release

Adds an admin next-action overview, per-referral activity history, private outreach records, linked quote summaries, and handyman updates for customer contact and booked visits. Existing referrals can use it without backfilling or resetting their status. Existing Create quote already copies the referral title, scope, customer and fee; this release preserves that implementation.

## Isolation and rollout

1. Leave `REFERRAL_WORKFLOW_ENABLED` unset (default off). Ship to a staging environment first. No new table is accessed when disabled; existing referral and quote routes keep their behavior.
2. Against staging only, run `pnpm exec tsx scripts/apply-referral-workflow.mts`. This creates one independent table with `IF NOT EXISTS`. It does not alter, delete or backfill existing records. Do not use `db:push` to deploy this feature: the repository's earlier migration snapshots need separate reconciliation.
3. Enable `REFERRAL_WORKFLOW_ENABLED=true` in staging. Use test accounts and test referrals; verify admin private notes are invisible to the handyman, unassigned handymen cannot fetch history, accepted referrals can record a contact and visit, and the existing quote creation/send/approval/payment paths still work. Use payment test mode and test recipients only.
4. Review the PR and staging results before production release. Apply the additive SQL before enabling the flag. Production migration/activation is a separate step; this PR does not execute it.
5. Roll back by unsetting the flag or setting it to `false`. Keep the activity table to preserve entries. No reversal of old job or payment state is needed.

## Behavior

- Outreach is a private manual record of communications already made. It sends no email/SMS, shares no customer details, and does not change assignment. Each entry names a candidate and timestamp; subsequent interest/unavailability entries preserve the history.
- Handymen can add contact/visit/note entries only for their own accepted referrals. Admin entries are private. Closed referrals are read-only. Scheduled dates are entered and displayed in the viewer's local time.
- Next actions are derived guidance, not automatic reminders or deadline rules. Quote approval is explicitly different from payment secured. No message history is imported or invented.
- Public quote links, commission calculations, taxes, payment webhooks, existing statuses and current job records are unchanged.

## Later phases

Safe reassignment with quote/payment checks and audit history; intake before assigning a handyman; photo upload improvements; quote revisions and duplicate-quote safeguards; timed reminders. These are intentionally separate from the first tracking release because they change active workflow behavior.

## Validation on this branch

- All 14 dedicated workflow tests pass (permissions, disabled-feature isolation, append-only writes, input validation and next-action guidance).
- Vite client production build and esbuild server bundle pass. The full prerender/browser-install portion of `pnpm build` was not run.
- TypeScript comparison against main commit `0aa576a`: both have the same 209 diagnostics after normalizing line numbers; this branch adds none.
- Full test suite with a dummy test-only Stripe key: branch 28 passed / 4 failed; unchanged main 14 passed / 4 failed. The same four existing failures remain. No live credentials were used.
- Live database migration, browser UI verification and end-to-end payment staging tests have not been performed. Keep this as a draft and the feature disabled until staging verification is complete.
