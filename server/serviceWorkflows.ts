import {and,eq,gt,gte,lte,asc,desc,ne,or,sql} from "drizzle-orm";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {router,protectedProcedure} from "./_core/trpc";
import {getDb} from "./db";
import {jobs,bids,payments,users,handymanProfiles,professionalAvailability,jobAppointments,jobMatchRuns,notifications,recurringRequests,jobAdditions} from "../drizzle/schema";
import {JOB_CATEGORIES} from "../shared/constants";
import {eligibleForJobInvitation} from "../shared/jobMatching";
import {ensureDirectRequest} from "./directRequests";
import {openJobDispute} from "./refundRouter";
const enabled=()=>process.env.SASKHANDY_V2_SERVICE_WORKFLOWS==="1";
const recurringEnabled=()=>enabled()&&process.env.SASKHANDY_V2_HOME==="1"&&process.env.SASKHANDY_V2_MATCHING==="1";
const id=z.number().int().positive();
function requireEnabled(){if(!enabled())throw new TRPCError({code:"PRECONDITION_FAILED",message:"This service tool is not available yet."});}
const expires=()=>new Date(Date.now()+28*86400000);
export const serviceWorkflowsRouter=router({
 additions:protectedProcedure.input(z.object({jobId:id})).query(async({ctx,input})=>{
  if(!enabled())return {enabled:false,items:[]};const db=await getDb();
  const [parent]=await db.select().from(jobs).where(eq(jobs.id,input.jobId)).limit(1);
  if(!parent||(![parent.homeownerId,parent.selectedHandymanId].includes(ctx.user.id)&&ctx.user.role!=="admin"))throw new TRPCError({code:"NOT_FOUND"});
  const items=await db.select({jobId:jobs.id,title:jobs.title,status:jobs.status,price:jobs.budgetMax}).from(jobAdditions).innerJoin(jobs,eq(jobs.id,jobAdditions.childJobId)).where(eq(jobAdditions.parentJobId,parent.id)).orderBy(desc(jobAdditions.createdAt)).limit(30);
  return {enabled:true,items};
 }),
 proposeAddition:protectedProcedure.input(z.object({jobId:id,title:z.string().trim().min(3).max(160),scope:z.string().trim().min(10).max(3000),price:z.number().min(.5).max(10000),requestKey:z.string().uuid()})).mutation(async({ctx,input})=>{
  requireEnabled();if(ctx.user.userType!=="handyman")throw new TRPCError({code:"FORBIDDEN"});
  const db=await getDb();return db.transaction(async tx=>{
   const [parent]=await tx.select().from(jobs).where(eq(jobs.id,input.jobId)).for("update");
   if(!parent||parent.selectedHandymanId!==ctx.user.id||parent.status!=="in_progress")throw new TRPCError({code:"CONFLICT",message:"Additional work can only be proposed on an active assigned job."});
   const [prior]=await tx.select().from(jobAdditions).where(eq(jobAdditions.requestKey,input.requestKey)).limit(1);
   if(prior){if(prior.parentJobId!==parent.id)throw new TRPCError({code:"CONFLICT"});return {jobId:prior.childJobId};}
   const existing=await tx.select({id:jobAdditions.id}).from(jobAdditions).where(eq(jobAdditions.parentJobId,parent.id)).limit(30);if(existing.length>=30)throw new TRPCError({code:"BAD_REQUEST",message:"Additional work limit reached."});
   const [profile]=await tx.select().from(handymanProfiles).where(eq(handymanProfiles.userId,ctx.user.id)).limit(1);
   if(!profile||!eligibleForJobInvitation(profile,parent))throw new TRPCError({code:"FORBIDDEN",message:"Your qualifications or service area need review."});
   const price=input.price.toFixed(2);
   const [j]=await tx.insert(jobs).values({homeownerId:parent.homeownerId,requestedHandymanId:ctx.user.id,title:input.title,description:input.scope,category:parent.category,location:parent.location,budgetMin:price,budgetMax:price,expiresAt:expires()});const jobId=Number(j.insertId);
   await tx.insert(bids).values({jobId,handymanId:ctx.user.id,bidAmount:price,message:input.scope,status:"pending"});
   await tx.insert(jobAdditions).values({parentJobId:parent.id,childJobId:jobId,requestKey:input.requestKey});
   await tx.insert(notifications).values({userId:parent.homeownerId,type:"new_bid",title:"Additional work proposed",message:"Review the separate quote for "+input.title+". The original job and payment have not changed.",link:"/jobs/"+jobId});
   return {jobId};
  });
 }),
 reportMissed:protectedProcedure.input(z.object({jobId:id,details:z.string().trim().min(10).max(1000)})).mutation(async({ctx,input})=>{
  requireEnabled();const db=await getDb();const [a]=await db.select().from(jobAppointments).where(eq(jobAppointments.jobId,input.jobId)).limit(1);
  if(!a||a.status!=="confirmed"||!a.endAt||a.endAt>new Date()||(ctx.user.id!==a.homeownerId&&ctx.user.id!==a.handymanId))throw new TRPCError({code:"BAD_REQUEST",message:"Report a missed appointment after the confirmed appointment has ended."});
  const disputeId=await openJobDispute(input.jobId,ctx.user.id,"Missed appointment reported: "+input.details);
  const other=ctx.user.id===a.homeownerId?a.handymanId:a.homeownerId;
  await db.insert(notifications).values({userId:other,type:"dispute_opened",title:"Missed appointment reported",message:"A missed appointment was reported. No automatic finding or refund has been made. Review the job and resolution options.",link:(other===a.homeownerId?"/jobs/":"/handyman/jobs/")+input.jobId});
  return {disputeId};
 }),
 recurring:protectedProcedure.query(async({ctx})=>{
  if(ctx.user.userType!=="homeowner")throw new TRPCError({code:"FORBIDDEN"});if(!recurringEnabled())return {enabled:false,plans:[]};const db=await getDb();
  return {enabled:true,plans:await db.select().from(recurringRequests).where(eq(recurringRequests.homeownerId,ctx.user.id)).orderBy(desc(recurringRequests.createdAt)).limit(50)};
 }),
 createPlan:protectedProcedure.input(z.object({handymanId:id,title:z.string().trim().min(3).max(160),description:z.string().trim().min(10).max(2000),category:z.enum(JOB_CATEGORIES),location:z.string().trim().min(2).max(255),intervalDays:z.union([z.literal(7),z.literal(14),z.literal(28)]),firstDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),consent:z.literal(true)})).mutation(async({ctx,input})=>{
  if(!recurringEnabled()||ctx.user.userType!=="homeowner"||!ctx.user.emailVerified)throw new TRPCError({code:"FORBIDDEN"});
  await ensureDirectRequest(ctx.user.id,input.handymanId,input);
  const next=new Date(input.firstDate+"T12:00:00-06:00");if(!Number.isFinite(next.getTime())||next.getTime()<Date.now()-12*3600000||next.getTime()>Date.now()+180*86400000)throw new TRPCError({code:"BAD_REQUEST",message:"Choose a first date within six months."});
  const db=await getDb();await db.transaction(async tx=>{
   await tx.select({id:users.id}).from(users).where(eq(users.id,ctx.user.id)).for("update");
   const prior=await tx.select({id:recurringRequests.id}).from(recurringRequests).where(and(eq(recurringRequests.homeownerId,ctx.user.id),ne(recurringRequests.status,"ended"))).limit(20);
   if(prior.length>=20)throw new TRPCError({code:"BAD_REQUEST",message:"Recurring plan limit reached."});
   await tx.insert(recurringRequests).values({homeownerId:ctx.user.id,handymanId:input.handymanId,title:input.title,description:input.description,category:input.category,location:input.location,intervalDays:input.intervalDays,nextRunAt:next});
  });return {success:true};
 }),
 setPlanStatus:protectedProcedure.input(z.object({id,status:z.enum(["active","paused","ended"])})).mutation(async({ctx,input})=>{
  if(!recurringEnabled()||ctx.user.userType!=="homeowner")throw new TRPCError({code:"FORBIDDEN"});
  const db=await getDb();await db.update(recurringRequests).set({status:input.status}).where(and(eq(recurringRequests.id,input.id),eq(recurringRequests.homeownerId,ctx.user.id),ne(recurringRequests.status,"ended")));return {success:true};
 }),
 riskQueue:protectedProcedure.query(async({ctx})=>{
  if(ctx.user.role!=="admin")throw new TRPCError({code:"FORBIDDEN"});if(!enabled())return [];
  const db=await getDb();
  return db.select({jobId:jobs.id,bidId:bids.id,amount:bids.bidAmount,budget:jobs.budgetMax}).from(bids).innerJoin(jobs,eq(jobs.id,bids.jobId)).where(and(eq(bids.status,"pending"),eq(jobs.status,"open"),or(gte(bids.bidAmount,"5000.00"),and(gte(bids.bidAmount,"500.00"),sql`${jobs.budgetMax} is not null and ${bids.bidAmount} > 3 * ${jobs.budgetMax}`)))).orderBy(desc(bids.createdAt)).limit(50);
 }),
});
export async function checkRecurringRequests(now:Date){
 if(!recurringEnabled())return;const db=await getDb();
 const due=await db.select({id:recurringRequests.id}).from(recurringRequests).where(and(eq(recurringRequests.status,"active"),lte(recurringRequests.nextRunAt,now))).orderBy(asc(recurringRequests.nextRunAt)).limit(30);
 for(const {id} of due)try{await db.transaction(async tx=>{
  const [p]=await tx.select().from(recurringRequests).where(eq(recurringRequests.id,id)).for("update");
  if(!p||p.status!=="active"||p.nextRunAt>now)return;
  if(p.lastJobId){const [last]=await tx.select({status:jobs.status}).from(jobs).where(eq(jobs.id,p.lastJobId)).limit(1);if(last&&!["completed","cancelled"].includes(last.status)){await tx.update(recurringRequests).set({nextRunAt:new Date(now.getTime()+86400000)}).where(eq(recurringRequests.id,id));return;}}
  const [owner]=await tx.select().from(users).where(eq(users.id,p.homeownerId)).limit(1);
  const [person]=await tx.select({profile:handymanProfiles,user:users}).from(handymanProfiles).innerJoin(users,eq(users.id,handymanProfiles.userId)).where(eq(users.id,p.handymanId)).limit(1);
  const [availability]=process.env.SASKHANDY_V2_APPOINTMENTS==="1"?await tx.select().from(professionalAvailability).where(eq(professionalAvailability.handymanId,p.handymanId)).limit(1):[];
  if(!owner||owner.userType!=="homeowner"||!owner.emailVerified||!person||person.user.userType!=="handyman"||!person.user.emailVerified||availability?.acceptingJobs===false||!eligibleForJobInvitation(person.profile,p)){
   await tx.update(recurringRequests).set({status:"paused"}).where(eq(recurringRequests.id,id));if(owner)await tx.insert(notifications).values({userId:owner.id,type:"system",title:"Recurring request paused",message:"Your selected professional or account needs review. No booking or payment was made.",link:"/my-home"});return;
  }
  const [j]=await tx.insert(jobs).values({homeownerId:p.homeownerId,requestedHandymanId:p.handymanId,title:p.title,description:p.description,category:p.category,location:p.location,expiresAt:expires()});const jobId=Number(j.insertId);
  await tx.insert(jobMatchRuns).values({jobId});
  await tx.update(recurringRequests).set({lastJobId:jobId,nextRunAt:new Date(now.getTime()+p.intervalDays*86400000)}).where(eq(recurringRequests.id,id));
  await tx.insert(notifications).values({userId:p.homeownerId,type:"system",title:"Recurring quote request created",message:p.title+" is ready for your chosen professional to quote. You will still approve price and payment.",link:"/jobs/"+jobId});
 });}catch(e){console.error("[Recurring] workflow failed",id,e);}
}
export async function acceptMarketplaceQuote(bidId:number,homeownerId:number){
 const db=await getDb();return db.transaction(async tx=>{
  const [initial]=await tx.select().from(bids).where(eq(bids.id,bidId)).limit(1);if(!initial)throw new TRPCError({code:"NOT_FOUND"});
  const [job]=await tx.select().from(jobs).where(eq(jobs.id,initial.jobId)).for("update");
  const [bid]=await tx.select().from(bids).where(eq(bids.id,bidId)).for("update");
  if(!job||job.homeownerId!==homeownerId||!bid||bid.jobId!==job.id||bid.status!=="pending"||job.status!=="open"||job.selectedBidId||job.selectedHandymanId||(job.requestedHandymanId&&job.requestedHandymanId!==bid.handymanId))throw new TRPCError({code:"CONFLICT",message:"This quote is no longer available."});
  const [existing]=await tx.select({id:payments.id}).from(payments).where(eq(payments.jobId,job.id)).limit(1);if(existing)throw new TRPCError({code:"CONFLICT",message:"Payment already exists."});
  const cents=Math.round(Number(bid.bidAmount)*100);if(!Number.isSafeInteger(cents)||cents<50||cents>99999999)throw new TRPCError({code:"BAD_REQUEST",message:"Quote amount is outside the supported range."});const fee=Math.round(cents*.2);
  await tx.update(bids).set({status:"accepted"}).where(eq(bids.id,bidId));await tx.update(bids).set({status:"rejected"}).where(and(eq(bids.jobId,job.id),ne(bids.id,bidId),eq(bids.status,"pending")));
  await tx.update(jobs).set({status:"awaiting_payment",selectedBidId:bidId,selectedHandymanId:bid.handymanId}).where(eq(jobs.id,job.id));
  await tx.insert(payments).values({jobId:job.id,homeownerId,handymanId:bid.handymanId,amount:(cents/100).toFixed(2),platformFee:(fee/100).toFixed(2),handymanPayout:((cents-fee)/100).toFixed(2)});
  return {amount:cents/100,platformFee:fee/100,handymanPayout:(cents-fee)/100};
 });
}
