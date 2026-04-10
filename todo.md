# SaskHandy TODO

## Database & Backend
- [x] Extend users table with userType (homeowner/handyman)
- [x] Create handyman_profiles table
- [x] Create jobs table with status enum (open, in_progress, completed, disputed)
- [x] Create bids table
- [x] Create payments table (escrow, 80/20 split)
- [x] Create reviews table (1-5 star ratings)
- [x] Create disputes table
- [x] Run migrations via SQL scripts
- [x] tRPC router: jobs (create, list, getById, updateStatus, getOpen, getByCategory)
- [x] tRPC router: bids (create, getForJob, getForHandyman, accept, reject)
- [x] tRPC router: payments (createPaymentIntent, getByJob, getHandymanEarnings)
- [x] tRPC router: handymanProfiles (get, update, getById)
- [x] tRPC router: reviews (create, getForUser, getMyReview)
- [x] tRPC router: disputes (create, getByJob, getAll, resolve)
- [x] tRPC router: admin (getStats, getUsers)
- [x] tRPC router: stripe (createPaymentIntent)

## Design System & Global
- [x] Configure elegant design tokens in index.css (premium green/gold palette)
- [x] Add Google Fonts (Playfair Display + Inter)
- [x] Update App.tsx with all routes and layout
- [x] StatusBadge component
- [x] StarRating component (display + input, 1-5 scale)
- [x] AppLayout with role-aware navigation

## Landing & Auth
- [x] Landing page with hero, features, how-it-works, CTA
- [x] Role selection page (homeowner vs handyman) after OAuth login
- [x] Onboarding: handyman profile creation form

## Homeowner Pages
- [x] Homeowner dashboard (active jobs, bids received, completed)
- [x] Post Job form (title, description, category, location, budget)
- [x] Job Details page (view bids, accept/reject, mark complete)
- [x] Payment flow (Stripe modal on bid acceptance)
- [x] Dispute initiation from job details

## Handyman Pages
- [x] Handyman dashboard (active bids, earnings, completed jobs)
- [x] Browse Jobs marketplace (filterable by category, search)
- [x] Job Detail + Place Bid form (with 80% payout preview)
- [x] My Bids page (pending/accepted/rejected)
- [x] Earnings page (total earned, payout history)
- [x] Profile edit page (bio, categories, hourly rate, insurance upload)

## Shared Pages
- [x] Mutual review & star-rating system (post-completion, both sides)
- [x] Dispute initiation flow (either party)
- [x] Admin panel: dispute list, resolve (release to handyman or refund homeowner)
- [x] Admin panel: user management table
- [x] Public handyman profile page

## Stripe Integration
- [x] Stripe SDK installed (stripe, @stripe/stripe-js, @stripe/react-stripe-js)
- [x] Stripe PaymentIntent creation on bid acceptance
- [x] Stripe webhook endpoint at /api/stripe/webhook
- [x] StripePaymentModal component with Elements provider
- [x] 80/20 split enforced: handyman 80%, platform 20%
- [x] File upload endpoint (/api/upload) for insurance certificates

## Testing & Delivery
- [x] Vitest: auth tests (me, logout)
- [x] Vitest: jobs router tests (create, getById, unauthorized)
- [x] Vitest: bids router tests (create)
- [x] Vitest: reviews router tests (rating validation)
- [x] Vitest: admin tests (stats, forbidden)
- [x] Vitest: platform fee split calculation
- [x] Vitest: job status enum validation
- [x] All 14 tests passing
- [x] Save checkpoint


## Messaging & Notifications (New)
- [ ] Add messages table to schema (job_id, sender_id, content, created_at)
- [ ] Create and apply migration for messages table
- [x] tRPC router: messages (create, getForJob, markAsRead)
- [x] Notification helper for key events
- [x] Send notifications on: new bid received, bid accepted, job marked complete, dispute opened
- [x] Frontend: JobChat component (message list + input form)
- [x] Integrate JobChat into homeowner and handyman job details pages
- [ ] Test messaging flow end-to-end
- [ ] Save checkpoint with messaging + notifications
- [ ] Export project as ZIP file
