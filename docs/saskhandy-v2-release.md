# SaskHandy 2.0 release contract
Source baseline: 8838183eca1b7278ba06daeeaddf6b59457e4687. One coordinated release, no independent production feature deployments.

## Product standard
Home projects. Made simple. Clear Canadian English, customer-facing quotes and requests, actionable errors. Inter, selective DM Serif Display, forest green, consistent spacing, accessible layouts, one primary action. Never invent reviews, activity, pricing or availability.

## Implemented in initial branch changes
Request-first homepage, same-tab sign-in handoff, removal of unverified hardcoded testimonials, optional budgets in create/edit/read, conservative identity/category/locality invitations, relevant regulated-category licence requirement, migration and unit test definitions and branch CI. Existing transaction, quote, referral and payout rules unchanged. No automatic assignments or charges. Missing free-text service areas suppress automatic invitations; marketplace browsing remains available. No availability or licence-scope inference. Same-tab unsubmitted request expires after one hour; cross-device re-entry required.

## Complete release gates
- Structured availability, durable invitation queue with retries/idempotency and fallback, no-match handling, cancellation recovery, notification preferences.
- Quote comparison, booking/rescheduling, appointment reminders, job timeline, payment and completion/receipt/review lifecycle.
- Safe photo/voice entry, rate limits, upload authorisation, private storage, responsive copy/design audit.
- Pro tools: quote templates, customers, invoices, calendar, booking links, analytics; My Home, saved pros, rebooking and maintenance; instant booking and price guidance feature-gated until validated.
- Self-service resolution, admin exceptions/health, funnel analytics, permissions audit and full staging E2E.

## Release and rollback
No merge/deploy until full scope and CI/staging gates pass. Record actual production deploy SHA (not necessarily main). Verify recoverable DB backup, schema and counts. Use Stripe test mode, non-production email/SMS. Never run destructive drizzle push; append explicit verified migrations to existing predeploy. Budget nullability preserves values; old UI may not display missing budgets correctly, so disable new missing-budget creation during rollback window or ensure old code compatibility. Never invent budget amounts. If release fails, stop new workflows, roll back to recorded working deployment, reconcile Stripe events and avoid blind DB restoration over new customer transactions.

## Durable matching implementation (development only)
Run `pnpm db:v2-matching` on a disposable staging database after the budget/referral migrations. Only after successful staging tests set SASKHANDY_V2_MATCHING=1; default is disabled. New requests are atomically queued in the job insert transaction. The existing quiet-hours reminder scheduler processes due waves of up to five distinct eligible providers at 0, 4 and 12 hours, then gives a truthful no-quote update after 24 hours (subject to scheduler cadence and quiet hours). Existing jobs are not backfilled or modified. In-app delivery is atomic; SMTP delivery retries are bounded but may duplicate an email after uncertain provider acceptance. No booking, selection, payment, or payout is automated by matching. Missing service areas and profiles prevent auto-invites. A quote arriving stops future waves; rejected quotes do not automatically restart matching yet. Feature flag off stops new runs and processing; existing queue rows persist. Admin health displays overdue runs and failed invitations; no guarantee of availability. Add tests for concurrent claims, job cancellation, late responses, SMTP timeouts and permissions before activation.
