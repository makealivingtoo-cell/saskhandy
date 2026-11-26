import { and, eq, inArray, lte, asc, sql } from "drizzle-orm";
import { bids, jobs, users, handymanProfiles, notifications, jobMatchRuns, jobMatchInvitations, professionalAvailability } from "../drizzle/schema";
import {getDb} from "./db";
import {eligibleForJobInvitation} from "../shared/jobMatching";
import {chooseInvitationIds,nextMatchingCheck,invitationRetryAt} from "../shared/matchingWorkflow";
import {formatJobTiming} from "../shared/constants";
import {sendNewJobPostedEmail} from "./email";

export const matchingEnabled=()=>process.env.SASKHANDY_V2_MATCHING==="1";
async function runWave(jobId:number,now:Date){
 const db=await getDb();
 await db.transaction(async tx=>{
  const [run]=await tx.select().from(jobMatchRuns).where(eq(jobMatchRuns.jobId,jobId)).for("update");
  if(!run||run.status!=="searching"||run.nextRunAt>now)return;
  const [job]=await tx.select().from(jobs).where(eq(jobs.id,jobId)).for("update");
  if(!job||job.status!=="open"||job.selectedHandymanId||job.selectedBidId||(job.expiresAt&&job.expiresAt<=now)){
   await tx.update(jobMatchRuns).set({status:"closed"}).where(eq(jobMatchRuns.jobId,jobId));return;
  }
  const activeBids=await tx.select({id:bids.id}).from(bids).where(and(eq(bids.jobId,jobId),inArray(bids.status,["pending","accepted"]))).limit(1);
  if(activeBids.length){await tx.update(jobMatchRuns).set({status:"quote_received"}).where(eq(jobMatchRuns.jobId,jobId));return;}
  if(run.wave>=3){
   await tx.insert(notifications).values({userId:job.homeownerId,type:"system",title:"Still waiting for a quote",message:`No quote has arrived for "${job.title}" yet. Your request is still open. You can update it or cancel if you no longer need help.`,link:`/jobs/${job.id}`});
   await tx.update(jobMatchRuns).set({status:"no_quote"}).where(eq(jobMatchRuns.jobId,jobId));return;
  }
  const candidates=await tx.select({profile:handymanProfiles,user:users}).from(handymanProfiles).innerJoin(users,eq(users.id,handymanProfiles.userId)).where(and(eq(users.userType,"handyman"),eq(users.emailVerified,true))).orderBy(asc(handymanProfiles.createdAt),asc(handymanProfiles.userId));
  const prior=await tx.select({id:jobMatchInvitations.handymanId}).from(jobMatchInvitations).where(eq(jobMatchInvitations.jobId,jobId));
  // Only complete eligible profiles can receive an automatic invitation; no inference of availability.
  const paused=process.env.SASKHANDY_V2_APPOINTMENTS==="1"?await tx.select({id:professionalAvailability.handymanId}).from(professionalAvailability).where(eq(professionalAvailability.acceptingJobs,false)):[];
  const pausedIds=new Set(paused.map(p=>p.id));
  const eligible=candidates.filter(({profile,user})=>!pausedIds.has(user.id)&&user.name&&user.name.trim().length>=2&&profile.profileImageUrl&&profile.bio&&profile.bio.trim().length>=25&&eligibleForJobInvitation(profile,job));
  // Rotate the starting position by job ID to avoid always favouring the oldest profiles.
  const offset=eligible.length?jobId%eligible.length:0;
  const rotated=[...eligible.slice(offset),...eligible.slice(0,offset)];
  for(const id of chooseInvitationIds(rotated.map(x=>x.user.id),prior.map(x=>x.id))){
   await tx.insert(jobMatchInvitations).values({jobId,handymanId:id});
   await tx.insert(notifications).values({userId:id,type:"system",title:"A new job matches your services",message:`Review "${job.title}" in ${job.location} and send a quote if it suits you.`,link:`/handyman/jobs/${job.id}`});
  }
  const nextWave=run.wave+1;
  const next=nextMatchingCheck(run.startedAt,nextWave);
  if(!next)throw new Error("Invalid matching wave");
  await tx.update(jobMatchRuns).set({wave:nextWave,nextRunAt:next}).where(eq(jobMatchRuns.jobId,jobId));
 });
}

async function deliverEmail(id:number,now:Date){
 const db=await getDb();
 const claim=await db.transaction(async tx=>{
  const [row]=await tx.select().from(jobMatchInvitations).where(eq(jobMatchInvitations.id,id)).for("update");
  if(!row||!["pending","sending"].includes(row.emailStatus)||row.nextAttemptAt>now)return null;
  if(row.attempts>=3){await tx.update(jobMatchInvitations).set({emailStatus:"failed"}).where(eq(jobMatchInvitations.id,id));return null;}
  const attempt=row.attempts+1;
  await tx.update(jobMatchInvitations).set({emailStatus:"sending",attempts:attempt,nextAttemptAt:new Date(now.getTime()+5*60*1000)}).where(eq(jobMatchInvitations.id,id));
  return {...row,attempt};
 });
 if(!claim)return;
 const guard=and(eq(jobMatchInvitations.id,id),eq(jobMatchInvitations.attempts,claim.attempt),eq(jobMatchInvitations.emailStatus,"sending"));
 try{
  const [job]=await db.select().from(jobs).where(eq(jobs.id,claim.jobId)).limit(1);
  const [person]=await db.select({profile:handymanProfiles,user:users}).from(handymanProfiles).innerJoin(users,eq(users.id,handymanProfiles.userId)).where(eq(users.id,claim.handymanId)).limit(1);
  const activeBids=await db.select({id:bids.id}).from(bids).where(and(eq(bids.jobId,claim.jobId),inArray(bids.status,["pending","accepted"]))).limit(1);
  if(!job||job.status!=="open"||job.selectedHandymanId||job.selectedBidId||(job.expiresAt&&job.expiresAt<=now)||activeBids.length||!person||person.user.userType!=="handyman"||!person.user.emailVerified||!person.user.email||!eligibleForJobInvitation(person.profile,job)){
   await db.update(jobMatchInvitations).set({emailStatus:"skipped"}).where(guard);return;
  }
  if(process.env.SASKHANDY_V2_APPOINTMENTS==="1"){
   const [availability]=await db.select().from(professionalAvailability).where(eq(professionalAvailability.handymanId,claim.handymanId)).limit(1);
   if(availability?.acceptingJobs===false){await db.update(jobMatchInvitations).set({emailStatus:"skipped"}).where(guard);return;}
  }
  await sendNewJobPostedEmail({to:person.user.email,handymanName:person.user.name,jobTitle:job.title,category:job.category,location:job.location,timing:formatJobTiming(job.timingPreference,job.preferredStartDate,job.preferredEndDate),jobId:job.id});
  await db.update(jobMatchInvitations).set({emailStatus:"sent"}).where(guard);
 }catch{
  const retry=invitationRetryAt(new Date(),claim.attempt);
  // SMTP is at-least-once: a timeout after provider acceptance can duplicate email.
  // The in-app invitation remains transactional and unique.
  await db.update(jobMatchInvitations).set(retry?{emailStatus:"pending",nextAttemptAt:retry}:{emailStatus:"failed"}).where(guard);
 }
}
let running=false;
export async function checkMatchingWorkflows(now=new Date()){
 if(!matchingEnabled()||running)return;
 running=true;
 try{
  const db=await getDb();
  const due=await db.select({id:jobMatchRuns.jobId}).from(jobMatchRuns).where(and(eq(jobMatchRuns.status,"searching"),lte(jobMatchRuns.nextRunAt,now))).orderBy(asc(jobMatchRuns.nextRunAt)).limit(20);
  for(const row of due){try{await runWave(row.id,now);}catch(error){console.error("[Matching] Wave failed",row.id,error);}}
  const emails=await db.select({id:jobMatchInvitations.id}).from(jobMatchInvitations).where(and(inArray(jobMatchInvitations.emailStatus,["pending","sending"]),lte(jobMatchInvitations.nextAttemptAt,now))).orderBy(asc(jobMatchInvitations.nextAttemptAt)).limit(20);
  for(const row of emails){try{await deliverEmail(row.id,new Date());}catch(error){console.error("[Matching] Delivery failed",row.id,error);}}
 }finally{running=false;}
}

export async function getMatchingStatus(jobId:number){
 const db=await getDb();
 const [run]=await db.select().from(jobMatchRuns).where(eq(jobMatchRuns.jobId,jobId)).limit(1);
 if(!run)return null;
 const [total]=await db.select({count:sql<number>`count(*)`}).from(jobMatchInvitations).where(eq(jobMatchInvitations.jobId,jobId));
 const [quote]=await db.select({id:bids.id}).from(bids).where(and(eq(bids.jobId,jobId),inArray(bids.status,["pending","accepted"]))).limit(1);
 return {status:quote?"quote_received" as const:run.status,invited:Number(total?.count??0),nextRunAt:run.status==="searching"?run.nextRunAt:null};
}
export async function getMatchingHealth(){
 const db=await getDb();
 const overdue=await db.select({id:jobMatchRuns.jobId}).from(jobMatchRuns).innerJoin(jobs,eq(jobs.id,jobMatchRuns.jobId)).where(and(eq(jobs.status,"open"),eq(jobMatchRuns.status,"searching"),lte(jobMatchRuns.nextRunAt,new Date(Date.now()-30*60*1000)))).limit(100);
 const unmatched=await db.select({id:jobs.id,title:jobs.title}).from(jobMatchRuns).innerJoin(jobs,eq(jobs.id,jobMatchRuns.jobId)).where(and(eq(jobs.status,"open"),eq(jobMatchRuns.status,"no_quote"),sql`not exists (select 1 from bids where bids.jobId=jobs.id and bids.status in ('pending','accepted'))`)).limit(50);
 const [failed]=await db.select({count:sql<number>`count(*)`}).from(jobMatchInvitations).where(eq(jobMatchInvitations.emailStatus,"failed"));
 return {overdue:overdue.length,unmatched,failedEmails:Number(failed?.count??0)};
}
