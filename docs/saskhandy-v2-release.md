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
