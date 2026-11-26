import {and,eq,desc} from "drizzle-orm";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {router,protectedProcedure} from "./_core/trpc";
import {getDb} from "./db";
import {quoteTemplates,quotes,users} from "../drizzle/schema";
import {groupCustomers,quoteSummary,parseTemplateLines} from "../shared/proTools";
export const proToolsEnabled=()=>process.env.SASKHANDY_V2_PRO==="1";
function check(role:string){if(role!=="handyman")throw new TRPCError({code:"FORBIDDEN"});}
function enabled(role:string){check(role);if(!proToolsEnabled())throw new TRPCError({code:"PRECONDITION_FAILED",message:"Business tools are not available yet."});}
const id=z.number().int().positive();
export const proToolsRouter=router({
 overview:protectedProcedure.query(async({ctx})=>{
  check(ctx.user.userType);
  if(!proToolsEnabled())return {enabled:false,templates:[],customers:[],summary:null};
  const db=await getDb();
  const templates=await db.select().from(quoteTemplates).where(eq(quoteTemplates.handymanId,ctx.user.id)).orderBy(desc(quoteTemplates.createdAt)).limit(100);
  const rows=await db.select({id:quotes.id,homeownerName:quotes.homeownerName,homeownerEmail:quotes.homeownerEmail,homeownerPhone:quotes.homeownerPhone,title:quotes.title,totalAmount:quotes.totalAmount,status:quotes.status,updatedAt:quotes.updatedAt}).from(quotes).where(eq(quotes.handymanId,ctx.user.id)).orderBy(desc(quotes.updatedAt)).limit(500);
  return {enabled:true,templates:templates.map(t=>({...t,items:parseTemplateLines(t.lineItems)})),customers:groupCustomers(rows),summary:quoteSummary(rows)};
 }),
 saveTemplate:protectedProcedure.input(z.object({quoteId:id,name:z.string().trim().min(1).max(100)})).mutation(async({ctx,input})=>{
  enabled(ctx.user.userType);const db=await getDb();
  await db.transaction(async tx=>{
   await tx.select({id:users.id}).from(users).where(eq(users.id,ctx.user.id)).for("update");
   const [q]=await tx.select().from(quotes).where(and(eq(quotes.id,input.quoteId),eq(quotes.handymanId,ctx.user.id))).limit(1);
   if(!q)throw new TRPCError({code:"NOT_FOUND"});
   const existing=await tx.select({id:quoteTemplates.id}).from(quoteTemplates).where(eq(quoteTemplates.handymanId,ctx.user.id)).limit(100);
   if(existing.length>=100)throw new TRPCError({code:"BAD_REQUEST",message:"You have reached the template limit."});
   // Store work and price only. No customer contact fields, quote token, referral ID,
   // payment state, platform fee or SMS permission is copied into a template.
   await tx.insert(quoteTemplates).values({handymanId:ctx.user.id,name:input.name,title:q.title,scope:q.scope,lineItems:JSON.stringify(parseTemplateLines(q.lineItems)),subtotal:q.subtotal,gstRate:q.gstRate,pstRate:q.pstRate});
  });
  return {success:true};
 }),
 deleteTemplate:protectedProcedure.input(z.object({id})).mutation(async({ctx,input})=>{
  enabled(ctx.user.userType);const db=await getDb();
  await db.delete(quoteTemplates).where(and(eq(quoteTemplates.id,input.id),eq(quoteTemplates.handymanId,ctx.user.id)));return {success:true};
 }),
});
