# Referral workflow tracking: first release

Adds an admin next-action overview, per-referral activity history, private outreach records, linked quote summaries, and handyman updates for customer contact and booked visits. Existing referrals can use it without backfilling or resetting their status. Existing Create quote already copies the referral title, scope, customer and fee; this release preserves that implementation.

## Isolation and rollout

1. Leave `REFERRAL_WORKFLOW_ENABLED` unset (default off). Ship to a staging environment first. This flag controls activity tracking only. Assignment eligibility is always enforced and requires its table before deploying this revision.
2. Against staging only, run `pnpm exec tsx scripts/apply-referral-workflow.mts`. This creates two independent tables with `IF NOT EXISTS`. It does not alter, delete or backfill existing records. Do not use `db:push` to deploy this feature: the repository's earlier migration snapshots need separate reconciliation.
3. Enable `REFERRAL_WORKFLOW_ENABLED=true` in staging. Use test accounts and test referrals; verify admin private notes are invisible to the handyman, unassigned handymen cannot fetch history, accepted referrals can record a contact and visit, and the existing quote creation/send/approval/payment paths still work. Use payment test mode and test recipients only.
4. Review the PR and staging results before production release. Apply both additive SQL files before deploying the assignment changes or enabling activity tracking. Production migration/activation is a separate step; this PR does not execute it.
5. Roll back by unsetting the flag or setting it to `false`. Keep the activity table to preserve entries. No reversal of old job or payment state is needed. Disabling this flag does not disable assignment eligibility; roll back the application revision if that change needs reversal.

## Behavior

- Outreach is a private manual record of communications already made. It sends no email/SMS, shares no customer details, and does not change assignment. Each entry names a candidate and timestamp; subsequent interest/unavailability entries preserve the history.
- Handymen can add contact/visit/note entries only for their own accepted referrals. Admin entries are private. Closed referrals are read-only. Scheduled dates are entered and displayed in the viewer's local time.
- Next actions are derived guidance, not automatic reminders or deadline rules. Quote approval is explicitly different from payment secured. No message history is imported or invented.
- Public quote links, commission calculations, taxes, payment webhooks, existing statuses and current job records are unchanged.

## Later phases

Safe reassignment with quote/payment checks and audit history; intake before assigning a handyman; photo upload improvements; quote revisions and duplicate-quote safeguards; timed reminders. These are intentionally separate from the first tracking release because they change active workflow behavior.

## Validation on this branch

- 25 dedicated tests pass (14 workflow and 11 assignment eligibility tests).
- Three real-MySQL integration checks pass in the disposable GitHub Actions database: additive migrations applied twice with existing referral/paid-quote rows unchanged; current eligibility enforced; referral acceptance through quote creation, sending, approval, simulated failed/successful payment and completion.
- External SMS, email and Stripe calls are mocked. These checks do not validate live delivery, real Stripe webhooks or concurrent lock contention.
- Vite client production build and esbuild server bundle pass. The full SEO prerender build was not run.
- TypeScript has 208 existing diagnostics versus 209 on the previous branch; no new file/error-code diagnostics. Earlier full-suite comparison identified the same four failures on unchanged main. The repository as a whole is not green.
- Chromium browser checks pass: eligible-only dropdown, empty state and disabled submission, existing-assignment warning, progress saving, outreach guidance, mobile horizontal layout, feature-off isolation and handyman update controls. Screenshots are attached to the CI run.
- Validation run: https://github.com/makealivingtoo-cell/saskhandy/actions/runs/42355242390 (tested application/test code at `4f06ec3`; subsequent changes document these results only).
- Production migration and deployment have not been performed.


## ID-matched referral assignments (additional change)

New referral assignments now require an existing handyman account, `identityVerificationStatus=approved`, and active referral access. Both the dropdown and the insert-time transaction enforce this. Account and identity rows stay locked until the referral insert completes; changing referral access uses the same account lock. Other verification badges do not grant eligibility.

The app previously had no account suspension/blocking field. The new admin controls are explicitly **referral-only restrictions** (active/suspended/blocked); they do not prevent login or change current jobs. Existing non-closed referrals display a review warning if their assigned handyman is no longer eligible. Missing profiles/accounts fail closed. Availability/category filtering is not part of this change.

**Deployment prerequisite:** re-run `pnpm exec tsx scripts/apply-referral-workflow.mts` before deploying this revision. It now also creates `referral_assignment_restrictions`; both CREATE TABLE statements are idempotent. Unlike activity tracking, the eligibility rule is always enforced on new assignments, independent of REFERRAL_WORKFLOW_ENABLED. If its table is absent, new assignments fail closed; existing quote/payment routes do not depend on it. No current referrals are rewritten or reassigned.

The GitHub Actions workflow uses an isolated MySQL service with synthetic records and no production credentials. Its schema reset is restricted to the disposable localhost test database. Browser checks use synthetic API responses; database integration tests independently exercise the real router and SQL paths.
