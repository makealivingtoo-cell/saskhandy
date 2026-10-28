# Meta conversion tracking

This change adds `Lead` after a customer job is saved and `CompleteRegistration`
after an account is created. Registration includes `user_type` so homeowner and
handyman acquisition can be separated in Events Manager. Admin-created jobs are
excluded. PageView remains browser-only. Payments and quote acceptance are not
included in this first integration.

## Production configuration

Set these in the hosting service's environment, never in source control:

| Variable | Value |
| --- | --- |
| `META_CAPI_ENABLED` | `true` to enable server delivery |
| `META_PIXEL_ID` | Confirm the dataset ID matches the existing browser Pixel |
| `VITE_META_PIXEL_ID` | Same dataset ID; browser currently defaults to `1016886836651819` |
| `META_CAPI_ACCESS_TOKEN` | Secret generated for this dataset in Meta Events Manager |
| `META_GRAPH_API_VERSION` | `v23.0` by default; update before this Graph version retires |
| `META_CAPI_TEST_EVENT_CODE` | Temporary code from Events Manager → Test events; remove after testing |

Never prefix the access token with `VITE_`: Vite exposes such variables publicly.
Build again if changing `VITE_META_PIXEL_ID`.

## Consent and matching

Meta Pixel and server events require the Ad privacy opt-in. Email/SMS marketing
preferences are separate and are not treated as advertising-measurement consent.
Declining or withdrawing prevents new events; GPC and DNT are respected. The
existing Google Analytics integration is unchanged by this Meta-only change.

Server events include normalized SHA-256 email, user agent and available `_fbp`
and `_fbc` cookies. Job text, addresses, images and messages are excluded. The
server fixes event names/source URLs, derives registration IDs from saved users,
and generates a unique job event ID after each successful job insert.
The browser receives the same event ID on mutation success, allowing Meta to
deduplicate both sources. A successful account creation is not email verification.

## Validation before enabling production reporting

1. Confirm the existing dataset ID in Meta Events Manager; configure the secret
   and temporary test-event code on a staging service using the same code.
2. Allow Meta tracking, create a test homeowner account, and post a test job.
   Expect `CompleteRegistration` and `Lead` from server and browser with matching
   event names/IDs. Check Events Manager deduplication and diagnostics.
3. Test handyman registration separately; inspect `user_type=handyman`.
4. Decline tracking and confirm no Meta Pixel loads or server events are sent.
   Withdraw an existing grant and verify subsequent actions produce no events.
5. Verify failed form submissions and admin job posts do not generate leads.
6. Remove the test-event code, deploy, then compare unique lead counts with saved
   customer jobs from visitors who opted in. Configure customer-lead and role-specific
   registration conversions in Meta; do not combine handyman sign-ups with customer leads.

## Delivery limits

Delivery is non-blocking, with a four-second timeout per attempt and at most three
attempts for transient failures. Repeated attempts preserve event ID/time. It is
not a durable outbox: process restarts and extended outages can lose pending
events. Logs report status only, never tokens, contact data or API response bodies.
No historical conversions are backfilled. End-to-end delivery must be verified
with the real dataset credentials; passing unit tests cannot establish this.

## Implementation validation

- 17 focused Meta tests pass, including consent, opt-out, hashing, deduplication
  payloads, test-event configuration, retries and failure isolation.
- Vite production build and server esbuild bundle pass.
- Full TypeScript check reports 209 errors on both the baseline and changed tree;
  existing diagnostics are equivalent apart from line numbers and union ordering.
- With a dummy Stripe key, the full test suite has four pre-existing failures
  (DB mocks, handyman profile prerequisites and logout cookie expectations),
  reproduced on the baseline. The ten other existing tests pass.
- Browser visual verification could not run because the available Playwright
  Chromium download was invalid. Validate the consent UI on staging before merging.
