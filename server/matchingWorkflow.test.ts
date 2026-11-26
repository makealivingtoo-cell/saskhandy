import {describe,it,expect} from "vitest";
import {chooseInvitationIds,nextMatchingCheck,invitationRetryAt} from "../shared/matchingWorkflow";
describe("matching workflow policy",()=>{
 it("never repeats an invitation or exceeds a wave",()=>{expect(chooseInvitationIds([1,1,2,3,4,5,6,7,8],[2])).toEqual([1,3,4,5,6]);});
 it("escalates using absolute due times",()=>{const start=new Date("2026-01-01T00:00:00Z");expect(nextMatchingCheck(start,1)?.toISOString()).toBe("2026-01-01T04:00:00.000Z");expect(nextMatchingCheck(start,3)?.toISOString()).toBe("2026-01-02T00:00:00.000Z");expect(nextMatchingCheck(start,4)).toBeNull();});
 it("bounds email retries",()=>{const now=new Date(0);expect(invitationRetryAt(now,1)?.getTime()).toBe(900000);expect(invitationRetryAt(now,3)).toBeNull();});
});
