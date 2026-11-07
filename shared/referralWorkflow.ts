/** Short, advisory next steps derived from the existing quote and referral states. */
export function referralNextAction(referralStatus: string, quoteStatus?: string | null): string {
  if (referralStatus === "completed") return "No action needed · completed";
  if (referralStatus === "cancelled" || referralStatus === "declined") return "Review before assigning someone else";
  switch (quoteStatus) {
    case "completed":
      return "No action needed · completed";
    case "paid":
      return "Confirm work is scheduled and progressing";
    case "payment_pending":
      return "Check that payment is secured before work starts";
    case "approved":
      return "Homeowner approved the quote · payment needed";
    case "sent":
    case "viewed":
      return "Follow up on homeowner quote review";
    case "draft":
      return "Handyman to send quote";
    case "payment_failed":
      return "Follow up on failed payment";
    case "declined":
    case "expired":
      return "Handyman to review and revise the quote";
  }
  switch (referralStatus) {
    case "sent":
      return "Handyman to accept referral";
    case "accepted":
      return "Handyman to contact homeowner / book inspection";
    case "awaiting_payment":
      return "Payment still needed before work starts";
    case "quote_sent":
      return "Follow up on quote approval";
    case "in_progress":
      return "Follow up on job progress";
    case "completed":
      return "No action needed · completed";
    case "declined":
    case "cancelled":
      return "Review before assigning someone else";
    default:
      return "Check status with handyman";
  }
}
