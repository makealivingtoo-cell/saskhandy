import {describe,expect,it} from "vitest";
import {validJobBudget,readJobBudget,formatJobBudget} from "../shared/jobBudget";
import {eligibleForJobInvitation} from "../shared/jobMatching";
describe("optional budget",()=>{
 it("preserves unknown budgets",()=>{expect(readJobBudget("","")).toEqual({budgetMin:null,budgetMax:null});expect(formatJobBudget(null,null)).toBe("Open to quotes");});
 it("validates both amounts",()=>{for(const [a,b] of [[null,10],[0,10],[NaN,10],[10,1],[1,Infinity],[1,100000000]] as const)expect(validJobBudget(a,b)).toBe(false);expect(readJobBudget("10","20")).toEqual({budgetMin:10,budgetMax:20});});
});
describe("matching",()=>{
 const p={categories:'["Carpentry","Electrical"]',serviceArea:"Saskatoon and Warman",identityVerificationStatus:"approved"};
 const j={category:"Carpentry",location:"Saskatoon, SK"};
 it("requires locality, category and verified identity",()=>{expect(eligibleForJobInvitation(p,j)).toBe(true);expect(eligibleForJobInvitation({...p,serviceArea:"Regina"},j)).toBe(false);expect(eligibleForJobInvitation({...p,serviceArea:""},j)).toBe(false);expect(eligibleForJobInvitation({...p,identityVerificationStatus:"pending"},j)).toBe(false);expect(eligibleForJobInvitation(p,{...j,category:"Painting"})).toBe(false);});
 it("requires reviewed licence for potentially regulated categories",()=>{expect(eligibleForJobInvitation(p,{...j,category:"Electrical"})).toBe(false);expect(eligibleForJobInvitation({...p,tradeLicenseVerificationStatus:"approved"},{...j,category:"Electrical"})).toBe(true);});
});
