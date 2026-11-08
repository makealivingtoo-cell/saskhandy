# SaskHandy referral follow-up queue

This is a **manual, admin-only** organization layer on the existing referral workflow.
It does not send messages, change referral/quote/payment status, or create new database tables.

## Using the queue

- Search existing referrals by homeowner, job, handyman, category or phone.
- Filter for **Needs review**, waiting on handyman, quote review, payment, in progress or closed.
- The summary counts referrals requiring a review, including outstanding admin-scheduled follow-ups.
- Overdue and due-today follow-ups appear first. An activity gap is labelled **no logged update**, not proof that nobody communicated.

## Record a handyman response and follow-up

1. Open **View / log activity** under an existing referral.
2. Select **Handyman outreach (private)** and type a factual contact or response note (or customize a quick template).
3. Optionally choose **Next follow-up date and time**.
4. Click **Save update**. A new activity row is saved and the referral list refreshes.
5. To clear an outstanding follow-up, log a *new* handyman outreach update without a date. The most recent outreach record becomes the current reminder.

All admin outreach notes stay private to the admin; they are not sent to the handyman.
Handymen may still record homeowner contact and inspections on accepted referrals.
Inspection schedules are separate from admin follow-up reminders.

## Existing safeguards

- No new migration or changes to `referral_jobs`, `quotes`, Stripe payments or the 20% commission.
- Eligibility for creating referrals still requires approved ID Name Matched status.
- Quote approval is not treated as money received.
- Existing activity history and admin-only privacy flags are retained.
