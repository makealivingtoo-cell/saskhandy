import {describe,it,expect} from "vitest";import {canSeeDirectedJob,historicalRange} from "../shared/requestPolicy";
describe("private request and pricing policy",()=>{
 it("allows only the owner, chosen pro and admin",()=>{const job={homeownerId:1,requestedHandymanId:2};expect(canSeeDirectedJob(job,null)).toBe(false);expect(canSeeDirectedJob(job,{id:3,role:"user"})).toBe(false);expect(canSeeDirectedJob(job,{id:1,role:"user"})).toBe(true);expect(canSeeDirectedJob(job,{id:2,role:"user"})).toBe(true);expect(canSeeDirectedJob(job,{id:3,role:"admin"})).toBe(true);});
 it("suppresses thin samples and duplicate jobs",()=>{const rows=Array.from({length:5},(_,i)=>({jobId:i+1,handymanId:i%3+1,amount:String(50+i*25)}));expect(historicalRange(rows.slice(0,4))).toBeNull();expect(historicalRange([...rows,rows[0]])).toEqual({low:75,high:125,sample:5});expect(historicalRange(rows.map(r=>({...r,handymanId:1})))).toBeNull();});
});
