import {describe,it,expect} from "vitest";
import {publicProfessional} from "../shared/publicProfessional";
import type {HandymanProfile} from "../drizzle/schema";
describe("public professional profile",()=>{
 it("returns only public fields, never documents or financial information",()=>{
  const p={id:1,userId:2,bio:"Carpenter",identityDocumentUrl:"private-id",insuranceCertUrl:"private-insurance",criminalRecordCheckUrl:"private-crc",tradeLicenseDocumentUrl:"private-licence",identityRejectionReason:"private note",tradeLicenseNumber:"private number",stripeAccountId:"acct_private",totalEarnings:"500",tradeLicenseVerificationStatus:"pending",tradeLicenseType:"Electrician"} as unknown as HandymanProfile;
  const result=publicProfessional(p);
  for(const k of ["identityDocumentUrl","insuranceCertUrl","criminalRecordCheckUrl","tradeLicenseDocumentUrl","identityRejectionReason","tradeLicenseNumber","stripeAccountId","totalEarnings"])expect(result).not.toHaveProperty(k);
  expect(result.tradeLicenseType).toBeNull();
 });
});
