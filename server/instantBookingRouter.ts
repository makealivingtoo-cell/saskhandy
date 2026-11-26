import {and,eq,gt,lt,lte,inArray,asc,isNull} from "drizzle-orm";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {router,protectedProcedure,publicProcedure} from "./_core/trpc";
import {getDb} from "./db";
import {instantSlots,users,handymanProfiles,professionalAvailability,jobAppointments,jobs,bids,payments,notifications} from "../drizzle/schema";
import {BOOKABLE_SERVICES,bookingEnabled,validSlotPrice,splitPrice,priceRange} from "../shared/instantBooking";
import {validAppointmentWindow} from "../shared/appointmentPolicy";
import {eligibleForJobInvitation} from "../shared/jobMatching";
const service=z.enum(Object.keys(BOOKABLE_SERVICES) as [keyof typeof BOOKABLE_SERVICES,...(keyof typeof BOOKABLE_SERVICES)[]]);
const id=z.number().int().positive();
type Tx=Parameters<Parameters<Awaited<ReturnType<typeof getDb>>["transaction"]>[0]>[0];
const unavailable=()=>new TRPCError({code:"CONFLICT",message:"That time is no longer available. Choose another appointment."});
function requireEnabled(){if(!bookingEnabled())throw new TRPCError({code:"PRECONDITION_FAILED",message:"Instant booking is not available yet."});}
async function eligible(tx:Tx,handymanId:number,key:keyof typeof BOOKABLE_SERVICES){
 const [person]=await tx.select().from(users).where(eq(users.id,handymanId)).for("update");
 const [profile]=await tx.select().from(handymanProfiles).where(eq(handymanProfiles.userId,handymanId)).limit(1);
 const [availability]=await tx.select().from(professionalAvailability).where(eq(professionalAvailability.handymanId,handymanId)).limit(1);
 return !!person&&person.userType==="handyman"&&person.emailVerified&&!!person.name&&!!profile&&!!profile.profileImageUrl&&!!profile.bio&&profile.bio.trim().length>=25&&availability?.acceptingJobs!==false&&eligibleForJobInvitation(profile,{category:BOOKABLE_SERVICES[key].category,location:"Saskatoon"});
}
async function overlaps(tx:Tx,handymanId:number,start:Date,end:Date){
 const conflict=await tx.select({id:jobAppointments.jobId}).from(jobAppointments).innerJoin(jobs,eq(jobs.id,jobAppointments.jobId)).where(and(eq(jobAppointments.handymanId,handymanId),eq(jobAppointments.status,"confirmed"),inArray(jobs.status,["awaiting_payment","in_progress"]),lt(jobAppointments.startAt,end),gt(jobAppointments.endAt,start))).limit(1).for("update");
 return !!conflict.length;
}
export const instantBookingRouter=router({
 catalog:publicProcedure.query(async()=>{
  if(!bookingEnabled())return {enabled:false,slots:[],guidance:[]};
  const db=await getDb(),now=new Date(Date.now()+3600000);
  const rows=await db.select({slot:instantSlots,profile:handymanProfiles,user:users,availability:professionalAvailability}).from(instantSlots).innerJoin(users,eq(users.id,instantSlots.handymanId)).innerJoin(handymanProfiles,eq(handymanProfiles.userId,users.id)).leftJoin(professionalAvailability,eq(professionalAvailability.handymanId,users.id)).where(and(eq(instantSlots.status,"available"),gt(instantSlots.startAt,now),eq(users.userType,"handyman"),eq(users.emailVerified,true))).orderBy(asc(instantSlots.startAt)).limit(100);
  const slots=rows.filter(({slot,profile,user,availability})=>Object.hasOwn(BOOKABLE_SERVICES,slot.service)&&!!user.name&&!!profile.profileImageUrl&&!!profile.bio&&profile.bio.trim().length>=25&&availability?.acceptingJobs!==false&&eligibleForJobInvitation(profile,{category:BOOKABLE_SERVICES[slot.service as keyof typeof BOOKABLE_SERVICES].category,location:"Saskatoon"})).map(({slot,user})=>({id:slot.id,handymanId:slot.handymanId,name:user.name,service:slot.service,scope:slot.scope,price:slot.price,startAt:slot.startAt,endAt:slot.endAt}));
  // Public guidance is a range of real listed offers, not a prediction for an unknown job.
  return {enabled:true,slots,guidance:Object.keys(BOOKABLE_SERVICES).map(key=>({service:key,range:priceRange(slots.filter(s=>s.service===key))}))};
 }),
 mine:protectedProcedure.query(async({ctx})=>{
  if(ctx.user.userType!=="handyman")throw new TRPCError({code:"FORBIDDEN"});
  if(!bookingEnabled())return {enabled:false,slots:[]};
  const db=await getDb();return {enabled:true,slots:await db.select().from(instantSlots).where(eq(instantSlots.handymanId,ctx.user.id)).orderBy(asc(instantSlots.startAt)).limit(100)};
 }),
 publish:protectedProcedure.input(z.object({service,scope:z.string().trim().min(5).max(500),price:z.number().refine(validSlotPrice),startAt:z.string().datetime(),endAt:z.string().datetime()})).mutation(async({ctx,input})=>{
  requireEnabled();if(ctx.user.userType!=="handyman")throw new TRPCError({code:"FORBIDDEN"});
  const start=new Date(input.startAt),end=new Date(input.endAt),now=new Date();
  if(!validAppointmentWindow(start,end,now)||start.getTime()<now.getTime()+3600000||start.getTime()>now.getTime()+60*86400000||end.getTime()-start.getTime()>4*3600000)throw new TRPCError({code:"BAD_REQUEST",message:"Choose a 30-minute to 4-hour slot at least one hour ahead, within 60 days."});
  const db=await getDb();await db.transaction(async tx=>{
   if(!await eligible(tx,ctx.user.id,input.service))throw new TRPCError({code:"FORBIDDEN",message:"Complete your verified profile, service category and Saskatoon service area before publishing."});
   const conflict=await tx.select({id:instantSlots.id}).from(instantSlots).where(and(eq(instantSlots.handymanId,ctx.user.id),eq(instantSlots.status,"available"),lt(instantSlots.startAt,end),gt(instantSlots.endAt,start))).limit(1).for("update");
   if(conflict.length||await overlaps(tx,ctx.user.id,start,end))throw new TRPCError({code:"CONFLICT",message:"That time overlaps another available or reserved appointment."});
   await tx.insert(instantSlots).values({handymanId:ctx.user.id,service:input.service,scope:input.scope,price:input.price.toFixed(2),startAt:start,endAt:end});
  });return {success:true};
 }),
 withdraw:protectedProcedure.input(z.object({id})).mutation(async({ctx,input})=>{
  requireEnabled();if(ctx.user.userType!=="handyman")throw new TRPCError({code:"FORBIDDEN"});const db=await getDb();
  await db.update(instantSlots).set({status:"withdrawn"}).where(and(eq(instantSlots.id,input.id),eq(instantSlots.handymanId,ctx.user.id),eq(instantSlots.status,"available")));return {success:true};
 }),
 reserve:protectedProcedure.input(z.object({id,expectedPrice:z.number().refine(validSlotPrice),acceptedScope:z.literal(true)})).mutation(async({ctx,input})=>{
  requireEnabled();if(ctx.user.userType!=="homeowner"||!ctx.user.emailVerified)throw new TRPCError({code:"FORBIDDEN",message:"Verify your homeowner account before booking."});
  const db=await getDb();return db.transaction(async tx=>{
   const [initial]=await tx.select().from(instantSlots).where(eq(instantSlots.id,input.id)).limit(1);
   if(!initial||!Object.hasOwn(BOOKABLE_SERVICES,initial.service))throw unavailable();
   const key=initial.service as keyof typeof BOOKABLE_SERVICES;
   if(!await eligible(tx,initial.handymanId,key))throw unavailable();
   const [slot]=await tx.select().from(instantSlots).where(eq(instantSlots.id,input.id)).for("update");
   if(!slot)throw unavailable();
   if(slot.status==="reserved"&&slot.jobId){const [existing]=await tx.select().from(jobs).where(eq(jobs.id,slot.jobId)).limit(1);if(existing?.homeownerId===ctx.user.id&&existing.status!=="cancelled")return {jobId:existing.id};}
   if(slot.status!=="available"||Number(slot.price)!==input.expectedPrice||slot.startAt.getTime()<Date.now()+3600000||await overlaps(tx,slot.handymanId,slot.startAt,slot.endAt))throw unavailable();
   const spec=BOOKABLE_SERVICES[key],money=splitPrice(Number(slot.price)),holdUntil=new Date(Date.now()+20*60000);
   const [j]=await tx.insert(jobs).values({homeownerId:ctx.user.id,title:spec.label,description:spec.description+"\nPublished scope: "+slot.scope,category:spec.category,location:"Saskatoon, SK",budgetMin:money.amount,budgetMax:money.amount,status:"awaiting_payment",selectedHandymanId:slot.handymanId});
   const jobId=Number(j.insertId);
   const [b]=await tx.insert(bids).values({jobId,handymanId:slot.handymanId,bidAmount:money.amount,status:"accepted",message:spec.description+"\n"+slot.scope,availability:slot.startAt.toISOString()});
   await tx.update(jobs).set({selectedBidId:Number(b.insertId)}).where(eq(jobs.id,jobId));
   await tx.insert(payments).values({jobId,homeownerId:ctx.user.id,handymanId:slot.handymanId,...money,status:"pending"});
   await tx.insert(jobAppointments).values({jobId,homeownerId:ctx.user.id,handymanId:slot.handymanId,status:"confirmed",startAt:slot.startAt,endAt:slot.endAt});
   await tx.update(instantSlots).set({status:"reserved",jobId,holdUntil}).where(eq(instantSlots.id,slot.id));
   await tx.insert(notifications).values({userId:slot.handymanId,type:"system",title:"Appointment reserved — awaiting payment",message:spec.label+" has been reserved. Do not start work until payment is confirmed.",link:"/handyman/jobs/"+jobId});
   return {jobId};
  });
 }),
 status:protectedProcedure.input(z.object({jobId:id})).query(async({ctx,input})=>{
  if(!bookingEnabled())return null;const db=await getDb();
  const [row]=await db.select({slot:instantSlots,job:jobs}).from(instantSlots).innerJoin(jobs,eq(jobs.id,instantSlots.jobId)).where(and(eq(instantSlots.jobId,input.jobId),eq(jobs.homeownerId,ctx.user.id))).limit(1);
  return row?{startAt:row.slot.startAt,endAt:row.slot.endAt,holdUntil:row.slot.holdUntil,checkoutStarted:!!row.slot.checkoutStartedAt,status:row.slot.status}:null;
 }),
 cancelHold:protectedProcedure.input(z.object({jobId:id})).mutation(async({ctx,input})=>{
  requireEnabled();if(!await cancelUnpaidHold(input.jobId,ctx.user.id))throw new TRPCError({code:"CONFLICT",message:"This reservation can no longer be cancelled automatically. If payment was started, contact support."});return {success:true};
 }),
});
export async function claimBookingCheckout(jobId:number,homeownerId:number){
 // Keep booking enabled until outstanding reservations are reconciled.
 const db=await getDb();await db.transaction(async tx=>{
  const [job]=await tx.select().from(jobs).where(eq(jobs.id,jobId)).for("update");
  if(!job||job.homeownerId!==homeownerId||job.status!=="awaiting_payment")throw new TRPCError({code:"BAD_REQUEST",message:"This job is not awaiting payment."});
  if(!bookingEnabled())return;
  const [slot]=await tx.select().from(instantSlots).where(eq(instantSlots.jobId,jobId)).for("update");
  if(!slot)return;
  if(slot.status!=="reserved"||slot.startAt<=new Date()||(!slot.checkoutStartedAt&&(!slot.holdUntil||slot.holdUntil<=new Date())))throw unavailable();
  if(!slot.checkoutStartedAt)await tx.update(instantSlots).set({checkoutStartedAt:new Date()}).where(eq(instantSlots.id,slot.id));
 });
}
async function cancelUnpaidHold(jobId:number,owner?:number){
 const db=await getDb();return db.transaction(async tx=>{
  const [job]=await tx.select().from(jobs).where(eq(jobs.id,jobId)).for("update");
  if(!job||job.status!=="awaiting_payment"||(owner!==undefined&&job.homeownerId!==owner))return false;
  const [slot]=await tx.select().from(instantSlots).where(eq(instantSlots.jobId,jobId)).for("update");
  const [payment]=await tx.select().from(payments).where(eq(payments.jobId,jobId)).for("update");
  if(!slot||slot.status!=="reserved"||slot.checkoutStartedAt||!payment||payment.status!=="pending"||payment.stripePaymentIntentId|| (owner===undefined&&(!slot.holdUntil||slot.holdUntil>new Date())))return false;
  await tx.update(instantSlots).set({status:"withdrawn"}).where(eq(instantSlots.id,slot.id));
  await tx.update(jobs).set({status:"cancelled",cancelReason:"booking_hold_cancelled",cancelledAt:new Date()}).where(eq(jobs.id,jobId));
  await tx.update(bids).set({status:"cancelled"}).where(eq(bids.jobId,jobId));
  await tx.update(payments).set({status:"failed"}).where(eq(payments.jobId,jobId));
  await tx.update(jobAppointments).set({status:"cancelled"}).where(eq(jobAppointments.jobId,jobId));
  for(const userId of [job.homeownerId,slot.handymanId])await tx.insert(notifications).values({userId,type:"system",title:"Unpaid reservation cancelled",message:"The appointment reservation ended before checkout was started. No payment was collected.",link:userId===job.homeownerId?"/jobs/"+jobId:"/handyman/jobs/"+jobId});
  return true;
 });
}
export async function checkBookingHolds(now:Date){
 if(!bookingEnabled())return;const db=await getDb();
 const rows=await db.select({jobId:instantSlots.jobId}).from(instantSlots).where(and(eq(instantSlots.status,"reserved"),isNull(instantSlots.checkoutStartedAt),lte(instantSlots.holdUntil,now))).limit(50);
 for(const row of rows)if(row.jobId)try{await cancelUnpaidHold(row.jobId);}catch(e){console.error("[Booking] hold cleanup failed",row.jobId,e);}
}
