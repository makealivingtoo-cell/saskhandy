# Meta customer lead tracking

SaskHandy uses the existing Meta Pixel and the Conversions API with Meta
connection configured in Events Manager. This change adds a browser Lead event
after a homeowner successfully posts a job. Admin submissions are excluded.
The event contains only Customer Job Posted, website, and homeowner labels;
no job descriptions, addresses, photos, budgets or contact details are passed.
Tracking exceptions cannot interrupt the success confirmation or navigation.

Existing CompleteRegistration tracking already distinguishes homeowner and
handyman sign-ups, and is retained. Existing PageView behavior is retained.

There is no custom server CAPI sender, no access token to configure, no new
consent UI or privacy-policy edit, and no changes to Google tracking or the
server routes in this PR. Existing browser tracking behavior is preserved.
Meta's managed connection has been observed sending PageView server events.
Server delivery of Lead and CompleteRegistration still needs verification.
Deduplication investigation and fixes are deferred at the owner's request.

## After deployment

Use Meta Test Events and a legitimate homeowner job submission to verify one
browser Lead after success, labelled Customer Job Posted. Do not submit fake
jobs to production: job posts notify handymen. Failed submissions and admin
job posts should not trigger this Lead. Inspect the managed connection separately
to confirm whether it also forwards Lead and CompleteRegistration events.

## Local sync

The existing branch is feat/meta-conversions-api. If already checked out:

    git pull --ff-only origin feat/meta-conversions-api

Otherwise fetch and switch to that branch. This PR does not deploy the site.
