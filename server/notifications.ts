import { notifyOwner } from "./_core/notification";

export type NotificationEvent =
  | "new_bid_received"
  | "bid_accepted"
  | "job_completed"
  | "dispute_opened";

export async function sendNotification(
  event: NotificationEvent,
  data: {
    jobId?: number;
    jobTitle?: string;
    userName?: string;
    bidAmount?: number;
    message?: string;
  }
): Promise<boolean> {
  let title = "";
  let content = "";

  switch (event) {
    case "new_bid_received":
      title = `New Bid on "${data.jobTitle}"`;
      content = `${data.userName} placed a bid of $${data.bidAmount}. ${data.message ? `Message: ${data.message}` : ""}`;
      break;

    case "bid_accepted":
      title = `Your Bid Was Accepted!`;
      content = `Your bid of $${data.bidAmount} on "${data.jobTitle}" has been accepted. You will earn $${Math.round(data.bidAmount! * 0.8 * 100) / 100} after the 20% platform fee.`;
      break;

    case "job_completed":
      title = `Job Completed: "${data.jobTitle}"`;
      content = `The job has been marked as completed. You can now leave a review and receive your payment.`;
      break;

    case "dispute_opened":
      title = `Dispute Opened on "${data.jobTitle}"`;
      content = `A dispute has been opened. Our team will review and resolve it within 48 hours. ${data.message ? `Reason: ${data.message}` : ""}`;
      break;
  }

  try {
    const success = await notifyOwner({ title, content });
    console.log(`[Notification] ${event}: ${success ? "sent" : "failed"}`);
    return success;
  } catch (err: any) {
    console.error(`[Notification] Error sending ${event}:`, err.message);
    return false;
  }
}
