import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "./db";
import {jobs,payments,bids,quotes,referralJobs,notifications} from "../drizzle/schema";
import {matchesIntent,acceptsJobPayment,acceptsQuotePayment,type IntentRecord} from "../shared/paymentIntegrity";
function positiveId(raw:string|undefined){return raw&&/^\d+$/.test(raw)&&Number.isSafeInteger(Number(raw))&&Number(raw)>0?Number(raw):null;}
export async function reconcilePayment(intent:IntentRecord):Promise<"applied"|"ignored">{
 const success=intent.status==="succeeded",failure=["requires_payment_method","canceled"].includes(intent.status);
 if(!success&&!failure)return "ignored";
 const jobId=positiveId(intent.metadata?.jobId),quoteId=positiveId(intent.metadata?.quoteId);
 if((!jobId&&!quoteId)||(jobId&&quoteId))return "ignored";
 const db=await getDb();
 return db.transaction(async tx=>{
  if(quoteId){
   const [q]=await tx.select().from(quotes).where(eq(quotes.id,quoteId)).for("update");
   if(!q||!acceptsQuotePayment(q.status)||!matchesIntent(intent,{id:q.stripePaymentIntentId,amount:q.totalAmount,quoteId,handymanId:q.handymanId}))return "ignored";
   await tx.update(quotes).set(success?{status:"paid",paidAt:new Date()}:{status:"payment_failed"}).where(eq(quotes.id,q.id));
   if(success&&q.referralJobId)await tx.update(referralJobs).set({status:"in_progress"}).where(and(eq(referralJobs.id,q.referralJobId),inArray(referralJobs.status,["accepted","quote_sent","awaiting_payment"])));
   return "applied";
  }
  const [job]=await tx.select().from(jobs).where(eq(jobs.id,jobId!)).for("update");
  if(!job||!job.selectedBidId||!job.selectedHandymanId)return "ignored";
  const rows=await tx.select().from(payments).where(eq(payments.jobId,job.id)).for("update");
  if(rows.length!==1)return "ignored";
  const p=rows[0];
  if(!acceptsJobPayment(job.status,p.status)||p.homeownerId!==job.homeownerId||p.handymanId!==job.selectedHandymanId||!matchesIntent(intent,{id:p.stripePaymentIntentId,amount:p.amount,jobId:job.id,homeownerId:job.homeownerId,handymanId:job.selectedHandymanId}))return "ignored";
  const [bid]=await tx.select().from(bids).where(eq(bids.id,job.selectedBidId)).limit(1);
  if(!bid||bid.jobId!==job.id||bid.handymanId!==p.handymanId||bid.status!=="accepted"||Number(bid.bidAmount)!==Number(p.amount))return "ignored";
  // "pending" on the payment row means funds secured but not yet released;
  // job state differentiates unpaid from secured in the existing model.
  await tx.update(payments).set({status:success?"pending":"failed"}).where(eq(payments.id,p.id));
  if(success){
   await tx.update(jobs).set({status:"in_progress"}).where(eq(jobs.id,job.id));
   await tx.insert(notifications).values({userId:p.handymanId,type:"payment_received",title:"Payment secured",message:"Payment for "+job.title+" has been confirmed. You can arrange the work.",link:"/handyman/jobs/"+job.id});
  }
  return "applied";
 });
}
