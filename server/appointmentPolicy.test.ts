import {describe,it,expect} from "vitest";
import {validAppointmentWindow,intervalsOverlap,canRespondToProposal} from "../shared/appointmentPolicy";
describe("appointment policy",()=>{
 it("rejects past times, short appointments and reversed times",()=>{const now=new Date(0),start=new Date(3600000);expect(validAppointmentWindow(start,new Date(7200000),now)).toBe(true);expect(validAppointmentWindow(now,start,now)).toBe(false);expect(validAppointmentWindow(start,new Date(3700000),now)).toBe(false);expect(validAppointmentWindow(start,now,now)).toBe(false);});
 it("allows adjacent appointments but not overlaps",()=>{const d=(n:number)=>new Date(n);expect(intervalsOverlap(d(0),d(10),d(10),d(20))).toBe(false);expect(intervalsOverlap(d(0),d(10),d(9),d(20))).toBe(true);});
 it("requires the other participant and current proposal version",()=>{expect(canRespondToProposal(1,2,3,3)).toBe(true);expect(canRespondToProposal(1,1,3,3)).toBe(false);expect(canRespondToProposal(1,2,4,3)).toBe(false);});
});
