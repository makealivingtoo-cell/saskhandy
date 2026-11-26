import {and,eq,gt,desc} from "drizzle-orm";
import {getDb} from "./db";
import {jobs,payments,users,handymanProfiles,savedProfessionals,professionalAvailability} from "../drizzle/schema";
import {eligibleForJobInvitation} from "../shared/jobMatching";
import {historicalRange} from "../shared/requestPolicy";
import {TRPCError} from "@trpc/server";
export async function ensureDirectRequest(owner:number,pro:number,input:{category:string;location:string}){
 if(process.env.SASKHANDY_V2_HOME!=="1"||process.env.SASKHANDY_V2_MATCHING!=="1")throw new TRPCError({code:"PRECONDITION_FAILED",message:"Direct requests are unavailable."});
 const db=await getDb();
 const [saved]=await db.select({id:savedProfessionals.id}).from(savedProfessionals).where(and(eq(savedProfessionals.homeownerId,owner),eq(savedProfessionals.handymanId,pro))).limit(1);
 const [previous]=await db.select({id:jobs.id}).from(jobs).where(and(eq(jobs.homeownerId,owner),eq(jobs.selectedHandymanId,pro),eq(jobs.status,"completed"))).limit(1);
 if(!saved&&!previous)throw new TRPCError({code:"FORBIDDEN",message:"Save this professional before requesting them directly."});
 const [p]=await db.select({profile:handymanProfiles,user:users}).from(handymanProfiles).innerJoin(users,eq(users.id,handymanProfiles.userId)).where(eq(users.id,pro)).limit(1);
 const [availability]=process.env.SASKHANDY_V2_APPOINTMENTS==="1"?await db.select().from(professionalAvailability).where(eq(professionalAvailability.handymanId,pro)).limit(1):[];
 if(!p||p.user.userType!=="handyman"||!p.user.emailVerified||availability?.acceptingJobs===false||!p.profile.bio||p.profile.bio.trim().length<25||!p.profile.profileImageUrl||!eligibleForJobInvitation(p.profile,input))throw new TRPCError({code:"BAD_REQUEST",message:"This professional is not available for the selected service or area. Choose another service or request public quotes."});
}
export async function localPriceGuidance(category:string,location:string){
 if(!/\bsaskatoon\b/i.test(location))return null;
 const db=await getDb();
 const rows=await db.select({jobId:jobs.id,amount:payments.amount,fee:payments.platformFee,payout:payments.handymanPayout,handymanId:payments.handymanId,location:jobs.location}).from(jobs).innerJoin(payments,eq(payments.jobId,jobs.id)).where(and(eq(jobs.category,category),eq(jobs.status,"completed"),eq(payments.status,"completed"),gt(jobs.updatedAt,new Date(Date.now()-365*86400000)))).orderBy(desc(jobs.updatedAt)).limit(250);
 return historicalRange(rows.filter(r=>/\bsaskatoon\b/i.test(r.location)).map(r=>({...r,amount:(Number(r.fee)+Number(r.payout)).toFixed(2)})));
}
