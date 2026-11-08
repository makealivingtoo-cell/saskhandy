import { describe, expect, it } from "vitest";
import {
  daysWithoutLoggedActivity,
  getFollowUpState,
  getReferralStage,
  matchesReferralFilter,
  referralNeedsAttention,
  referralTriageRank,
} from "./referralTriage";

const now = new Date("2026-11-08T12:00:00-06:00");
const base = { status: "accepted", createdAt: new Date("2026-11-04T12:00:00-06:00") };

describe("admin referral triage", () => {
  it("only claims a follow-up is due when an explicit scheduled outreach exists", () => {
    expect(getFollowUpState(base, now)).toBeNull();
    expect(getFollowUpState({...base,latestOutreach:{note:"Will call",createdAt:now,scheduledFor:"2026-11-07T12:00:00-06:00"}},now)).toBe("overdue");
    expect(getFollowUpState({...base,latestOutreach:{note:"Will call",createdAt:now,scheduledFor:"2026-11-08T17:00:00-06:00"}},now)).toBe("today");
    expect(getFollowUpState({...base,latestOutreach:{note:"Will call",createdAt:now,scheduledFor:"2026-11-10T12:00:00-06:00"}},now)).toBe("upcoming");
    expect(getFollowUpState({...base,status:"completed",latestOutreach:{note:"Will call",createdAt:now,scheduledFor:"2026-11-07T12:00:00-06:00"}},now)).toBeNull();
  });
  it("separates quotation review from actual payment", () => {
    expect(getReferralStage({...base,status:"quote_sent",latestQuote:{status:"viewed"}})).toBe("quote");
    expect(getReferralStage({...base,status:"quote_sent",latestQuote:{status:"approved"}})).toBe("payment");
    expect(getReferralStage({...base,status:"in_progress",latestQuote:{status:"paid"}})).toBe("active");
    expect(getReferralStage({...base,status:"accepted",latestQuote:{status:"paid"}})).toBe("active");
    expect(getReferralStage({...base,status:"completed",latestQuote:{status:"paid"}})).toBe("closed");
  });
  it("counts inactive notes accurately without pretending contact was made", () => {
    expect(daysWithoutLoggedActivity(base,now)).toBe(4);
    expect(daysWithoutLoggedActivity({...base,lastActivityAt:new Date("2026-11-08T10:00:00-06:00")},now)).toBe(0);
    expect(referralNeedsAttention({...base,lastActivityAt:now},now)).toBe(false);
    expect(referralNeedsAttention({...base,status:"sent",lastActivityAt:now},now)).toBe(true);
    expect(referralNeedsAttention({...base,status:"completed"},now)).toBe(false);
    expect(matchesReferralFilter({...base,lastActivityAt:now},"attention",now)).toBe(false);
  });
  it("sorts overdue reminders ahead of unpaid quotes and closed referrals", () => {
    const overdue={...base, latestOutreach:{note:"Call",createdAt:now,scheduledFor:"2026-11-07T12:00:00-06:00"}};
    const failed={...base,latestQuote:{status:"payment_failed"}};
    expect(referralTriageRank(overdue,now)).toBeLessThan(referralTriageRank(failed,now));
    expect(referralTriageRank(failed,now)).toBeLessThan(referralTriageRank({...base,status:"completed"},now));
  });
});
