import { describe, expect, it } from "vitest";
import { referralNextAction } from "../shared/referralWorkflow";

describe("referral next-action advice", () => {
  it("does not confuse quote approval with money received", () => {
    expect(referralNextAction("quote_sent", "approved")).toContain("payment needed");
    expect(referralNextAction("awaiting_payment", "payment_pending")).toContain("before work starts");
  });

  it("shows useful steps for each state without mutating records", () => {
    expect(referralNextAction("sent")).toContain("accept");
    expect(referralNextAction("accepted")).toContain("contact homeowner");
    expect(referralNextAction("completed", "completed")).toContain("No action needed");
    expect(referralNextAction("quote_sent", "payment_failed")).toContain("failed payment");
  });
});
