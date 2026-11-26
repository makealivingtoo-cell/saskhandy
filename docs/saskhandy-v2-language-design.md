# SaskHandy 2.0 — design and language standard

## Product voice
Canadian English. Short, direct, calm and specific. Say "Request help", "Send quote", "Choose a professional", "Payment required", "Payment secured" only after verification, and "Report a problem". Do not change internal bid/payment status enums or routes. A professional's identity check is not a guarantee of quality, credentials or insurance. Never imply a quote, price, appointment or refund exists unless the stored state supports it. Use CAD and explicitly identify the scope/fees; avoid fabricated testimonials, false urgency and blanket guarantees.

## Shared layout
Retain Inter and selective DM Serif Display; forest-green primary, neutral surfaces, consistent borders and whitespace. Primary buttons use comfortable 44px minimum height, larger CTAs 48px; compact secondary controls remain compact. Use one clear primary action, sentence-case headings, plain-language errors, proper field labels and focus-visible navigation. Mobile text-entry controls target 16px to avoid zoom. Preserve reduced-motion preferences. Use skip link, semantic main region, aria-current navigation and descriptive status labels.

## Source review and implementation
Reviewed main entry/registration, role selection, onboarding, homeowner dashboard/create/edit/detail, professional dashboard/browse/quotes/detail/profile/earnings, public profile/quote, support/admin/messages, open-job discovery and shared SEO template. Revised user-visible wording in the core flows and shared shell, including clear quote terminology and payment status. Existing legal documents, article content and localized SEO pages were not individually rewritten: avoid changing legal terms or unsupported local claims without review.

## Acceptance checks still required
Browser-rendered desktop/mobile audit of every route and state; actual screenshots and accessibility testing; keyboard-only navigation, touch targets, contrast, zoom, overflow, error/loading/empty states, real user feedback. Ensure legacy referral and payment states keep their meaning. This is a source-level review, not a claim of complete visual acceptance.

A Playwright desktop/mobile smoke gate and screenshot artifact are configured in CI. It verifies representative core pages with seeded synthetic users and no external browser requests. Full per-route and state review remains a release gate.
