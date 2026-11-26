import type {HandymanProfile} from "../drizzle/schema";
// Explicit allowlist: never serialize IDs, private documents, notes,
// contact details, payout account details or earnings from full profile rows.
export function publicProfessional(p:HandymanProfile){
 return {
  id:p.id,userId:p.userId,bio:p.bio,categories:p.categories,hourlyRate:p.hourlyRate,rating:p.rating,totalJobs:p.totalJobs,
  profileImageUrl:p.profileImageUrl,serviceArea:p.serviceArea,externalGoogleReviewsUrl:p.externalGoogleReviewsUrl,
  externalFacebookReviewsUrl:p.externalFacebookReviewsUrl,externalWebsiteUrl:p.externalWebsiteUrl,
  insuranceVerified:p.insuranceVerified,identityVerificationStatus:p.identityVerificationStatus,
  criminalRecordCheckStatus:p.criminalRecordCheckStatus,tradeLicenseVerificationStatus:p.tradeLicenseVerificationStatus,
  tradeLicenseType:p.tradeLicenseVerificationStatus==="approved"?p.tradeLicenseType:null,
 };
}
