export const workflowKinds = [
  "customer_contacted",
  "visit_booked",
  "note",
  "outreach_sent",
  "interested",
  "unavailable",
] as const;
export const workflowLabels: Record<(typeof workflowKinds)[number], string> = {
  customer_contacted: "Customer contacted",
  visit_booked: "Visit booked",
  note: "Note",
  outreach_sent: "Outreach sent",
  interested: "Interested",
  unavailable: "Unavailable",
};

type Event = { kind: string; createdAt: Date; scheduledAt: Date | null };
type Quote = { id?: number; status: string; expiresAt: Date | null };
// Derived guidance only: never changes referral or payment state.
export function referralNextAction(
  status: string,
  events: Event[],
  quotes: Quote[],
  now = new Date()
) {
  if (["completed", "cancelled"].includes(status)) return null;
  if (quotes.some(q => q.status === "paid"))
    return "Payment secured — arrange or complete the work";
  if (quotes.some(q => q.status === "completed")) return null;
  // Older withdrawn/failed quotes must not overshadow a newer replacement.
  quotes = [...quotes]
    .filter(q => !["cancelled", "declined"].includes(q.status))
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    .slice(0, 1);
  if (status === "in_progress")
    return "Work in progress — confirm completion when finished";
  if (quotes.some(q => q.status === "payment_failed"))
    return "Payment failed — follow up with the homeowner";
  if (quotes.some(q => ["approved", "payment_pending"].includes(q.status)))
    return "Quote approved — payment not yet secured";
  if (quotes.some(q => q.status === "expired"))
    return "Quote expired — review before following up";
  if (
    quotes.some(
      q =>
        ["sent", "viewed"].includes(q.status) &&
        q.expiresAt &&
        q.expiresAt <= now
    )
  )
    return "Quote expired — review before following up";
  if (quotes.some(q => ["sent", "viewed"].includes(q.status)))
    return "Awaiting homeowner quote approval";
  if (status === "awaiting_payment") return "Awaiting payment confirmation";
  if (status === "quote_sent")
    return "Review the quote outcome before following up";
  if (status === "declined")
    return "Handyman declined — find another available handyman";
  if (status === "sent") return "Awaiting assigned handyman response";
  if (quotes.some(q => q.status === "draft"))
    return "Draft quote saved — review and send it";
  const visit = events
    .filter(e => e.kind === "visit_booked")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  if (visit?.scheduledAt && visit.scheduledAt > now)
    return "Visit booked — awaiting the scheduled visit";
  if (visit)
    return "Visit date passed — confirm the outcome and prepare a quote";
  if (events.some(e => e.kind === "customer_contacted"))
    return "Customer contacted — confirm scope and prepare a quote";
  return "Contact the homeowner to confirm scope and availability";
}
