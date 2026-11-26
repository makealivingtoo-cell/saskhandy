import {and,eq,ne,lt,gt,lte,asc,isNull} from "drizzle-orm";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {router,protectedProcedure} from "./_core/trpc";
import {getDb} from "./db";
import {jobs,users,jobAppointments,notifications,professionalAvailability} from "../drizzle/schema";
import {validAppointmentWindow,canRespondToProposal} from "../shared/appointmentPolicy";
export const appointmentsEnabled=()=>process.env.SASKHANDY_V2_APPOINTMENTS==="1";
function requireEnabled(){if(!appointmentsEnabled())throw new TRPCError({code:"PRECONDITION_FAILED",message:"Appointment scheduling is not available yet."});}
const jobInput=z.object({jobId:z.number().int().positive()});
const decisionInput=jobInput.extend({version:z.number().int().nonnegative()});
type Db=Awaited<ReturnType<typeof getDb>>;
type Tx=Parameters<Parameters<Db["transaction"]>[0]>[0];

async function lockParticipants(tx:Tx,jobId:number,actor:number){
 const [job]=await tx.select().from(jobs).where(eq(jobs.id,jobId)).for("update");
 if(!job||!job.selectedHandymanId||(job.homeownerId!==actor&&job.selectedHandymanId!==actor))throw new TRPCError({code:"NOT_FOUND"});
 if(job.status!=="in_progress")throw new TRPCError({code:"BAD_REQUEST",message:"Appointments can be arranged once payment is secured and the job is in progress."});
 // Serializes confirmations across all jobs for this professional.
 const [pro]=await tx.select({id:users.id}).from(users).where(eq(users.id,job.selectedHandymanId)).for("update");
 if(!pro)throw new TRPCError({code:"NOT_FOUND"});
 const [appointment]=await tx.select().from(jobAppointments).where(eq(jobAppointments.jobId,jobId)).for("update");
 if(appointment&&(appointment.homeownerId!==job.homeownerId||appointment.handymanId!==job.selectedHandymanId))throw new TRPCError({code:"CONFLICT",message:"The assigned professional has changed. Contact support."});
 return {job,appointment,other:actor===job.homeownerId?job.selectedHandymanId:job.homeownerId};
}
async function notifyAppointment(tx:Tx,jobId:number,userId:number,homeownerId:number,title:string,message:string){
 await tx.insert(notifications).values({userId,type:"system",title,message,link:userId===homeownerId?`/jobs/${jobId}`:`/handyman/jobs/${jobId}`});
}
export const appointmentRouter=router({
 getForJob:protectedProcedure.input(jobInput).query(async({ctx,input})=>{
  if(!appointmentsEnabled())return {enabled:false,appointment:null};
  const db=await getDb();
  const [job]=await db.select().from(jobs).where(eq(jobs.id,input.jobId)).limit(1);
  if(!job||!job.selectedHandymanId||(job.homeownerId!==ctx.user.id&&job.selectedHandymanId!==ctx.user.id))throw new TRPCError({code:"NOT_FOUND"});
  const [appointment]=await db.select().from(jobAppointments).where(eq(jobAppointments.jobId,input.jobId)).limit(1);
  if(appointment&&(appointment.homeownerId!==job.homeownerId||appointment.handymanId!==job.selectedHandymanId))throw new TRPCError({code:"NOT_FOUND"});
  return {enabled:true,appointment:appointment??null};
 }),
 propose:protectedProcedure.input(decisionInput.extend({startAt:z.string().datetime(),endAt:z.string().datetime()})).mutation(async({ctx,input})=>{
  requireEnabled();
  const start=new Date(input.startAt),end=new Date(input.endAt);
  if(!validAppointmentWindow(start,end,new Date()))throw new TRPCError({code:"BAD_REQUEST",message:"Choose a future appointment of 30 minutes to 12 hours, within the next 180 days."});
  const db=await getDb();
  return db.transaction(async tx=>{
   const {job,appointment,other}=await lockParticipants(tx,input.jobId,ctx.user.id);
   if((appointment?.version??0)!==input.version)throw new TRPCError({code:"CONFLICT",message:"This appointment changed. Refresh and try again."});
   const values={proposedStartAt:start,proposedEndAt:end,proposedBy:ctx.user.id,version:input.version+1,status:appointment?.status==="confirmed"?"confirmed" as const:"pending" as const};
   if(appointment)await tx.update(jobAppointments).set(values).where(eq(jobAppointments.jobId,job.id));
   else await tx.insert(jobAppointments).values({jobId:job.id,homeownerId:job.homeownerId,handymanId:job.selectedHandymanId!,...values});
   await notifyAppointment(tx,job.id,other,job.homeownerId,"Appointment time proposed",`A time has been proposed for "${job.title}". Review it and confirm or suggest another time.`);
   return {success:true};
  });
 }),
 respond:protectedProcedure.input(decisionInput.extend({accept:z.boolean()})).mutation(async({ctx,input})=>{
  requireEnabled();const db=await getDb();
  return db.transaction(async tx=>{
   const {job,appointment,other}=await lockParticipants(tx,input.jobId,ctx.user.id);
   if(!appointment||!appointment.proposedStartAt||!appointment.proposedEndAt||!canRespondToProposal(ctx.user.id,appointment.proposedBy,appointment.version,input.version))throw new TRPCError({code:"CONFLICT",message:"That proposal is no longer available for you to confirm."});
   if(input.accept){
    if(!validAppointmentWindow(appointment.proposedStartAt,appointment.proposedEndAt,new Date()))throw new TRPCError({code:"BAD_REQUEST",message:"This time is no longer available. Suggest another time."});
    const clash=await tx.select({id:jobAppointments.jobId}).from(jobAppointments).where(and(eq(jobAppointments.handymanId,job.selectedHandymanId!),ne(jobAppointments.jobId,job.id),eq(jobAppointments.status,"confirmed"),lt(jobAppointments.startAt,appointment.proposedEndAt),gt(jobAppointments.endAt,appointment.proposedStartAt))).limit(1).for("update");
    if(clash.length)throw new TRPCError({code:"CONFLICT",message:"The professional already has a confirmed appointment at that time. Suggest another time."});
   }
   await tx.update(jobAppointments).set({status:input.accept?"confirmed":appointment.status==="confirmed"?"confirmed":"cancelled",...(input.accept?{startAt:appointment.proposedStartAt,endAt:appointment.proposedEndAt,reminderSentAt:null}:{}),proposedStartAt:null,proposedEndAt:null,proposedBy:null,version:appointment.version+1}).where(eq(jobAppointments.jobId,job.id));
   await notifyAppointment(tx,job.id,other,job.homeownerId,input.accept?"Appointment confirmed":"Appointment proposal declined",input.accept?`Your appointment for "${job.title}" is confirmed. View the agreed time in your job.`:`The proposed time for "${job.title}" was declined. You can suggest another time.`);
   return {success:true};
  });
 }),
 cancel:protectedProcedure.input(decisionInput).mutation(async({ctx,input})=>{
  requireEnabled();const db=await getDb();
  return db.transaction(async tx=>{
   const {job,appointment,other}=await lockParticipants(tx,input.jobId,ctx.user.id);
   if(!appointment||appointment.status==="cancelled"||appointment.version!==input.version)throw new TRPCError({code:"CONFLICT",message:"This appointment is no longer available."});
   await tx.update(jobAppointments).set({status:"cancelled",proposedStartAt:null,proposedEndAt:null,proposedBy:null,version:appointment.version+1}).where(eq(jobAppointments.jobId,job.id));
   await notifyAppointment(tx,job.id,other,job.homeownerId,"Appointment cancelled",`The appointment for "${job.title}" was cancelled. The job and payment status have not changed. Arrange another time or contact support.`);
   return {success:true};
  });
 }),
 mine:protectedProcedure.query(async({ctx})=>{
  if(!appointmentsEnabled())return {enabled:false,appointments:[]};
  const db=await getDb();
  const rows=await db.select({appointment:jobAppointments,title:jobs.title}).from(jobAppointments).innerJoin(jobs,eq(jobs.id,jobAppointments.jobId)).where(and(eq(jobs.status,"in_progress"),ne(jobAppointments.status,"cancelled"),eq(jobAppointments.homeownerId,jobs.homeownerId),eq(jobAppointments.handymanId,jobs.selectedHandymanId),ctx.user.userType==="handyman"?eq(jobAppointments.handymanId,ctx.user.id):eq(jobAppointments.homeownerId,ctx.user.id))).orderBy(asc(jobAppointments.startAt)).limit(100);
  return {enabled:true,appointments:rows};
 }),
 availability:protectedProcedure.query(async({ctx})=>{
  if(ctx.user.userType!=="handyman")throw new TRPCError({code:"FORBIDDEN"});
  if(!appointmentsEnabled())return {enabled:false,acceptingJobs:true};
  const db=await getDb();const [row]=await db.select().from(professionalAvailability).where(eq(professionalAvailability.handymanId,ctx.user.id)).limit(1);
  return {enabled:true,acceptingJobs:row?.acceptingJobs??true};
 }),
 setAvailability:protectedProcedure.input(z.object({acceptingJobs:z.boolean()})).mutation(async({ctx,input})=>{
  requireEnabled();if(ctx.user.userType!=="handyman")throw new TRPCError({code:"FORBIDDEN"});
  const db=await getDb();await db.insert(professionalAvailability).values({handymanId:ctx.user.id,acceptingJobs:input.acceptingJobs}).onDuplicateKeyUpdate({set:{acceptingJobs:input.acceptingJobs}});
  return {success:true};
 }),
});
export async function checkAppointmentReminders(now:Date){
 if(!appointmentsEnabled())return;
 const db=await getDb();
 const due=await db.select({id:jobAppointments.jobId}).from(jobAppointments).where(and(eq(jobAppointments.status,"confirmed"),isNull(jobAppointments.reminderSentAt),gt(jobAppointments.startAt,now),lte(jobAppointments.startAt,new Date(now.getTime()+24*60*60*1000)))).limit(50);
 for(const {id} of due)try{
  await db.transaction(async tx=>{
   const [job]=await tx.select().from(jobs).where(eq(jobs.id,id)).for("update");
   const [a]=await tx.select().from(jobAppointments).where(eq(jobAppointments.jobId,id)).for("update");
   if(!job||job.status!=="in_progress"||!a||a.status!=="confirmed"||a.reminderSentAt||a.homeownerId!==job.homeownerId||a.handymanId!==job.selectedHandymanId||!a.startAt||a.startAt<=now||a.startAt.getTime()>now.getTime()+86400000)return;
   for(const recipient of [a.homeownerId,a.handymanId])await notifyAppointment(tx,id,recipient,a.homeownerId,"Your appointment is coming up",`Your appointment for "${job.title}" is within the next 24 hours. Review the confirmed time in your job.`);
   await tx.update(jobAppointments).set({reminderSentAt:now}).where(eq(jobAppointments.jobId,id));
  });
 }catch(error){console.error("[Appointment] reminder failed",id,error);}
}
