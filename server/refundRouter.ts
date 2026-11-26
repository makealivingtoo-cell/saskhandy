import {and,eq,inArray,sql} from "drizzle-orm";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {router,protectedProcedure} from "./_core/trpc";
import {getDb} from "./db";
import {stripe,retrievePaymentIntent} from "./stripe";
import {matchesIntent} from "../shared/paymentIntegrity";
import {refundSplit} from "../shared/refundPolicy";
import {jobs,payments,handymanProfiles,refundCases,disputes,notifications,jobAppointments} from "../drizzle/schema";
const enabled=()=>process.env.SASKHANDY_V2_RESOLUTION==="1";
const id=z.number().int().positive(),jobInput=z.object({jobId:id});
type Tx=Parameters<Parameters<Awaited<ReturnType<typeof getDb>>["transaction"]>[0]>[0];
function requireEnabled(){if(!enabled())throw new TRPCError({code:"PRECONDITION_FAILED",message:"Online settlement is not available yet."});}
async function lockJob(tx:Tx,jobId:number){
 const [job]=await tx.select().from(jobs).where(eq(jobs.id,jobId)).for("update");
 if(!job||!job.selectedHandymanId)throw new TRPCError({code:"NOT_FOUND"});
 const p=await tx.select().from(payments).where(eq(payments.jobId,jobId)).for("update");
 if(p.length!==1)throw new TRPCError({code:"CONFLICT",message:"Payment record requires review."});
 return {job,payment:p[0]};
}
function eligiblePayment(payment:typeof payments.$inferSelect){return payment.status==="pending"&&payment.stripeTransferStatus==="not_started"&&!payment.stripeTransferId&&!!payment.stripePaymentIntentId;}
async function notify(tx:Tx,userId:number,job:typeof jobs.$inferSelect,title:string,message:string){
 await tx.insert(notifications).values({userId,type:"system",title,message,link:(userId===job.homeownerId?"/jobs/":"/handyman/jobs/")+job.id});
}
async function verifyPaid(job:typeof jobs.$inferSelect,payment:typeof payments.$inferSelect){
 if(!eligiblePayment(payment))throw new TRPCError({code:"CONFLICT",message:"Funds have been released or need review."});
 const intent=await retrievePaymentIntent(payment.stripePaymentIntentId!);
 if(intent.status!=="succeeded"||!matchesIntent(intent,{id:payment.stripePaymentIntentId,amount:payment.amount,jobId:job.id,handymanId:payment.handymanId,homeownerId:job.homeownerId}))throw new TRPCError({code:"CONFLICT",message:"Payment has not been verified."});
 return intent;
}
export const refundRouter=router({
 status:protectedProcedure.input(jobInput).query(async({ctx,input})=>{
  if(!enabled())return {enabled:false,case:null,paymentAmount:null,canRequest:false};
  const db=await getDb();const [job]=await db.select().from(jobs).where(eq(jobs.id,input.jobId)).limit(1);
  if(!job||(ctx.user.id!==job.homeownerId&&ctx.user.id!==job.selectedHandymanId&&ctx.user.role!=="admin"))throw new TRPCError({code:"NOT_FOUND"});
  const [c]=await db.select().from(refundCases).where(eq(refundCases.jobId,job.id)).limit(1);
  const [payment]=await db.select().from(payments).where(eq(payments.jobId,job.id)).limit(1);
  return {enabled:true,case:c?{proposerId:c.proposerId,amount:c.amount,reason:c.reason,status:c.status}:null,paymentAmount:payment?.amount??null,canRequest:!c&&job.status==="in_progress"&&!!payment&&eligiblePayment(payment)};
 }),
 propose:protectedProcedure.input(jobInput.extend({amount:z.number().positive().max(1000000),reason:z.string().trim().min(10).max(1000),settlementAcknowledged:z.literal(true)})).mutation(async({ctx,input})=>{
  requireEnabled();const db=await getDb();
  return db.transaction(async tx=>{
   const {job,payment}=await lockJob(tx,input.jobId);
   if(ctx.user.id!==job.homeownerId&&ctx.user.id!==job.selectedHandymanId)throw new TRPCError({code:"NOT_FOUND"});
   if(job.status!=="in_progress"||!eligiblePayment(payment))throw new TRPCError({code:"CONFLICT",message:"Only secured, unreleased job payments can use online settlement."});
   const amount=Math.round(input.amount*100);if(Math.abs(input.amount*100-amount)>0.00001||amount>Math.round(Number(payment.amount)*100))throw new TRPCError({code:"BAD_REQUEST",message:"Enter an exact refund amount no greater than the original payment."});
   const [prior]=await tx.select().from(refundCases).where(eq(refundCases.jobId,job.id)).limit(1);const [dispute]=await tx.select().from(disputes).where(eq(disputes.jobId,job.id)).limit(1);
   if(prior||dispute)throw new TRPCError({code:"CONFLICT",message:"This job already has a resolution case."});
   await tx.insert(refundCases).values({jobId:job.id,proposerId:ctx.user.id,amount:(amount/100).toFixed(2),reason:input.reason});
   await tx.update(jobs).set({status:"disputed"}).where(eq(jobs.id,job.id));
   await notify(tx,ctx.user.id===job.homeownerId?job.selectedHandymanId!:job.homeownerId,job,"Refund settlement proposed","Review the proposed refund. Work and release of funds are paused until the case is resolved.");
   return {success:true};
  });
 }),
 respond:protectedProcedure.input(jobInput.extend({accept:z.boolean(),settlementAcknowledged:z.literal(true)})).mutation(async({ctx,input})=>{
  requireEnabled();const db=await getDb();return db.transaction(async tx=>{
   const {job,payment}=await lockJob(tx,input.jobId);
   const [c]=await tx.select().from(refundCases).where(eq(refundCases.jobId,job.id)).for("update");
   if(!c||c.status!=="proposed"||job.status!=="disputed"||!eligiblePayment(payment)||ctx.user.id===c.proposerId||(ctx.user.id!==job.homeownerId&&ctx.user.id!==job.selectedHandymanId))throw new TRPCError({code:"CONFLICT",message:"This settlement is not available for you to approve."});
   if(input.accept){await tx.update(refundCases).set({status:"approved",approvedAt:new Date()}).where(eq(refundCases.jobId,job.id));await notify(tx,c.proposerId,job,"Refund agreed","Both parties agreed. We will confirm the refund with Stripe before finalizing the settlement.");}
   else{await tx.update(refundCases).set({status:"escalated"}).where(eq(refundCases.jobId,job.id));await tx.insert(disputes).values({jobId:job.id,initiatedBy:c.proposerId,reason:"Settlement not agreed: "+c.reason});await notify(tx,c.proposerId,job,"Settlement needs review","The other party did not agree. The case has been sent for review; no funds were released.");}
   return {success:true};
  });
 }),
 adminQueue:protectedProcedure.query(async({ctx})=>{
  if(ctx.user.role!=="admin")throw new TRPCError({code:"FORBIDDEN"});if(!enabled())return [];
  const db=await getDb();return db.select({jobId:refundCases.jobId,status:refundCases.status,amount:refundCases.amount,updatedAt:refundCases.updatedAt}).from(refundCases).where(inArray(refundCases.status,["approved","processing","needs_review"])).limit(100);
 }),
});
export async function checkRefundCases(){
 if(!enabled())return;const db=await getDb();
 const due=await db.select({id:refundCases.jobId}).from(refundCases).where(inArray(refundCases.status,["approved","processing"])).limit(20);
 for(const {id} of due)try{await db.transaction(async tx=>{
  const {job,payment}=await lockJob(tx,id);
  const [c]=await tx.select().from(refundCases).where(eq(refundCases.jobId,id)).for("update");
  if(!c||!["approved","processing"].includes(c.status)||job.status!=="disputed")return;
  if(!eligiblePayment(payment)||!c.approvedAt||(!c.stripeRefundId&&Date.now()-c.approvedAt.getTime()>20*3600000)){await tx.update(refundCases).set({status:"needs_review"}).where(eq(refundCases.jobId,id));return;}
  const intent=await verifyPaid(job,payment);
  const amount=Math.round(Number(c.amount)*100),split=refundSplit(Math.round(Number(payment.amount)*100),Math.round(Number(payment.platformFee)*100),amount);
  const refund=c.stripeRefundId?await stripe.refunds.retrieve(c.stripeRefundId):await stripe.refunds.create({payment_intent:intent.id,amount,reason:"requested_by_customer",metadata:{saskhandyJobId:String(id)}},{idempotencyKey:"mutual-settlement-"+id});
  if(refund.amount!==amount||refund.currency!=="cad"||(typeof refund.payment_intent==="string"?refund.payment_intent:refund.payment_intent?.id)!==intent.id){await tx.update(refundCases).set({status:"needs_review",stripeRefundId:refund.id}).where(eq(refundCases.jobId,id));return;}
  if(refund.status!=="succeeded"){await tx.update(refundCases).set({status:refund.status==="pending"?"processing":"needs_review",stripeRefundId:refund.id}).where(eq(refundCases.jobId,id));return;}
  await tx.update(payments).set({status:split.remaining?"completed":"refunded",platformFee:(split.remainingFee/100).toFixed(2),handymanPayout:(split.payout/100).toFixed(2)}).where(eq(payments.id,payment.id));
  await tx.update(jobs).set(split.remaining?{status:"completed"}:{status:"cancelled",cancelledAt:new Date(),cancelReason:"agreed_refund"}).where(eq(jobs.id,id));
  await tx.update(jobAppointments).set({status:"cancelled"}).where(eq(jobAppointments.jobId,id));
  if(split.remaining)await tx.update(handymanProfiles).set({totalJobs:sql`coalesce(${handymanProfiles.totalJobs},0)+1`,totalEarnings:sql`coalesce(${handymanProfiles.totalEarnings},0)+${(split.payout/100).toFixed(2)}`}).where(eq(handymanProfiles.userId,payment.handymanId));
  await tx.update(refundCases).set({status:"settled",stripeRefundId:refund.id}).where(eq(refundCases.jobId,id));
  for(const userId of [job.homeownerId,payment.handymanId])await notify(tx,userId,job,"Refund confirmed","Stripe confirmed the agreed refund of $"+c.amount+" CAD. This job is settled. Any remaining professional earnings are recorded.");
 });}catch(e){console.error("[Refund] settlement requires retry/review",id,e instanceof Error?e.message:"error");}
}
// Lock the same job and payment rows as the refund workflow; never release unverified funds.
export async function finalizeSecuredJob(jobId:number,handymanId:number,fromDispute=false){
 const db=await getDb();return db.transaction(async tx=>{
  const {job,payment}=await lockJob(tx,jobId);
  if(job.selectedHandymanId!==handymanId||payment.handymanId!==handymanId||job.status!==(fromDispute?"disputed":"in_progress"))throw new TRPCError({code:"CONFLICT",message:"Job state changed. Refresh before completing."});
  if(enabled()){const [c]=await tx.select().from(refundCases).where(eq(refundCases.jobId,jobId)).limit(1);if(c&&c.status!=="escalated")throw new TRPCError({code:"CONFLICT",message:"An online refund settlement is active."});}
  await verifyPaid(job,payment);
  await tx.update(payments).set({status:"completed",stripeTransferStatus:"not_started"}).where(eq(payments.id,payment.id));
  await tx.update(jobs).set({status:"completed"}).where(eq(jobs.id,jobId));
  await tx.update(handymanProfiles).set({totalJobs:sql`coalesce(${handymanProfiles.totalJobs},0)+1`,totalEarnings:sql`coalesce(${handymanProfiles.totalEarnings},0)+${payment.handymanPayout}`}).where(eq(handymanProfiles.userId,handymanId));
  return {released:true};
 });
}

export async function openJobDispute(jobId:number,userId:number,reason:string){
 const db=await getDb();
 return db.transaction(async tx=>{
  const [job]=await tx.select().from(jobs).where(eq(jobs.id,jobId)).for("update");
  if(!job||(job.homeownerId!==userId&&job.selectedHandymanId!==userId))throw new TRPCError({code:"NOT_FOUND"});
  if(!["in_progress","completed"].includes(job.status))throw new TRPCError({code:"CONFLICT",message:"This job cannot open a new dispute."});
  const [existing]=await tx.select().from(disputes).where(eq(disputes.jobId,jobId)).limit(1);
  if(existing)throw new TRPCError({code:"CONFLICT",message:"A dispute already exists."});
  if(enabled()){const [c]=await tx.select().from(refundCases).where(eq(refundCases.jobId,jobId)).limit(1);if(c)throw new TRPCError({code:"CONFLICT",message:"A settlement case already exists."});}
  const [result]=await tx.insert(disputes).values({jobId,initiatedBy:userId,reason});
  await tx.update(jobs).set({status:"disputed"}).where(eq(jobs.id,jobId));return Number(result.insertId);
 });
}
