import {and,eq,desc,asc,lte,isNull} from "drizzle-orm";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {router,protectedProcedure} from "./_core/trpc";
import {getDb} from "./db";
import {homeProperties,homeMaintenance,savedProfessionals,users,handymanProfiles,notifications,jobs} from "../drizzle/schema";
export const myHomeEnabled=()=>process.env.SASKHANDY_V2_HOME==="1";
function requireHome(userType:string){if(userType!=="homeowner")throw new TRPCError({code:"FORBIDDEN"});if(!myHomeEnabled())throw new TRPCError({code:"PRECONDITION_FAILED",message:"My Home is not available yet."});}
const id=z.number().int().positive();
const validDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;});
export const myHomeRouter=router({
 overview:protectedProcedure.query(async({ctx})=>{
  if(ctx.user.userType!=="homeowner")throw new TRPCError({code:"FORBIDDEN"});
  if(!myHomeEnabled())return {enabled:false,properties:[],maintenance:[],saved:[],history:[]};
  const db=await getDb(),owner=ctx.user.id;
  const properties=await db.select().from(homeProperties).where(eq(homeProperties.homeownerId,owner)).orderBy(asc(homeProperties.label)).limit(50);
  const maintenance=await db.select().from(homeMaintenance).where(eq(homeMaintenance.homeownerId,owner)).orderBy(asc(homeMaintenance.completed),asc(homeMaintenance.dueDate)).limit(200);
  const saved=await db.select({id:savedProfessionals.handymanId,name:users.name,serviceArea:handymanProfiles.serviceArea,identityStatus:handymanProfiles.identityVerificationStatus}).from(savedProfessionals).innerJoin(users,eq(users.id,savedProfessionals.handymanId)).innerJoin(handymanProfiles,eq(handymanProfiles.userId,users.id)).where(and(eq(savedProfessionals.homeownerId,owner),eq(users.userType,"handyman"))).orderBy(desc(savedProfessionals.createdAt)).limit(100);
  const history=await db.select({id:jobs.id,title:jobs.title,location:jobs.location,handymanId:jobs.selectedHandymanId,updatedAt:jobs.updatedAt}).from(jobs).where(and(eq(jobs.homeownerId,owner),eq(jobs.status,"completed"))).orderBy(desc(jobs.updatedAt)).limit(100);
  return {enabled:true,properties,maintenance,saved,history};
 }),
 isSaved:protectedProcedure.input(z.object({handymanId:id})).query(async({ctx,input})=>{
  if(!myHomeEnabled()||ctx.user.userType!=="homeowner")return {enabled:false,saved:false};
  const db=await getDb();const [row]=await db.select({id:savedProfessionals.id}).from(savedProfessionals).where(and(eq(savedProfessionals.homeownerId,ctx.user.id),eq(savedProfessionals.handymanId,input.handymanId))).limit(1);
  return {enabled:true,saved:!!row};
 }),
 save:protectedProcedure.input(z.object({handymanId:id,saved:z.boolean()})).mutation(async({ctx,input})=>{
  requireHome(ctx.user.userType);const db=await getDb();
  if(!input.saved){await db.delete(savedProfessionals).where(and(eq(savedProfessionals.homeownerId,ctx.user.id),eq(savedProfessionals.handymanId,input.handymanId)));return {success:true};}
  const [person]=await db.select({id:users.id}).from(users).innerJoin(handymanProfiles,eq(handymanProfiles.userId,users.id)).where(and(eq(users.id,input.handymanId),eq(users.userType,"handyman"),eq(handymanProfiles.identityVerificationStatus,"approved"))).limit(1);
  if(!person)throw new TRPCError({code:"NOT_FOUND",message:"This professional is not available to save."});
  await db.insert(savedProfessionals).values({homeownerId:ctx.user.id,handymanId:input.handymanId}).onDuplicateKeyUpdate({set:{handymanId:input.handymanId}});
  return {success:true};
 }),
 addProperty:protectedProcedure.input(z.object({label:z.string().trim().min(1).max(100),city:z.string().trim().min(2).max(100)})).mutation(async({ctx,input})=>{
  requireHome(ctx.user.userType);const db=await getDb();
  await db.transaction(async tx=>{await tx.select({id:users.id}).from(users).where(eq(users.id,ctx.user.id)).for("update");const existing=await tx.select({id:homeProperties.id}).from(homeProperties).where(eq(homeProperties.homeownerId,ctx.user.id)).limit(50);if(existing.length>=50)throw new TRPCError({code:"BAD_REQUEST",message:"You have reached the property limit."});await tx.insert(homeProperties).values({...input,homeownerId:ctx.user.id});});return {success:true};
 }),
 addTask:protectedProcedure.input(z.object({propertyId:id,title:z.string().trim().min(2).max(160),dueDate:validDate})).mutation(async({ctx,input})=>{
  requireHome(ctx.user.userType);const db=await getDb();
  await db.transaction(async tx=>{await tx.select({id:users.id}).from(users).where(eq(users.id,ctx.user.id)).for("update");const [p]=await tx.select({id:homeProperties.id}).from(homeProperties).where(and(eq(homeProperties.id,input.propertyId),eq(homeProperties.homeownerId,ctx.user.id))).limit(1);if(!p)throw new TRPCError({code:"NOT_FOUND"});const existing=await tx.select({id:homeMaintenance.id}).from(homeMaintenance).where(eq(homeMaintenance.homeownerId,ctx.user.id)).limit(200);if(existing.length>=200)throw new TRPCError({code:"BAD_REQUEST",message:"You have reached the maintenance task limit."});await tx.insert(homeMaintenance).values({...input,homeownerId:ctx.user.id});});return {success:true};
 }),
 completeTask:protectedProcedure.input(z.object({id,completed:z.boolean()})).mutation(async({ctx,input})=>{
  requireHome(ctx.user.userType);const db=await getDb();await db.update(homeMaintenance).set({completed:input.completed}).where(and(eq(homeMaintenance.id,input.id),eq(homeMaintenance.homeownerId,ctx.user.id)));return {success:true};
 }),
 removeTask:protectedProcedure.input(z.object({id})).mutation(async({ctx,input})=>{
  requireHome(ctx.user.userType);const db=await getDb();await db.delete(homeMaintenance).where(and(eq(homeMaintenance.id,input.id),eq(homeMaintenance.homeownerId,ctx.user.id)));return {success:true};
 }),
});
export async function checkHomeMaintenance(now:Date){
 if(!myHomeEnabled())return;
 const day=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Regina",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const db=await getDb();const due=await db.select({id:homeMaintenance.id}).from(homeMaintenance).where(and(eq(homeMaintenance.completed,false),isNull(homeMaintenance.reminderSentAt),lte(homeMaintenance.dueDate,day))).limit(50);
 for(const {id} of due)try{await db.transaction(async tx=>{const [task]=await tx.select().from(homeMaintenance).where(eq(homeMaintenance.id,id)).for("update");if(!task||task.completed||task.reminderSentAt||task.dueDate>day)return;const [owner]=await tx.select({id:users.id}).from(users).where(and(eq(users.id,task.homeownerId),eq(users.userType,"homeowner"))).limit(1);if(!owner)return;await tx.insert(notifications).values({userId:task.homeownerId,type:"system",title:"Home maintenance reminder",message:task.title+" is due. Review your maintenance list in My Home.",link:"/my-home"});await tx.update(homeMaintenance).set({reminderSentAt:now}).where(eq(homeMaintenance.id,id));});}catch(e){console.error("[My Home] reminder failed",id,e);}
}
