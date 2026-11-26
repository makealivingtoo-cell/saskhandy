import {describe,it,expect,beforeAll,afterAll,vi} from "vitest";
import {eq,and} from "drizzle-orm";
import {getDb,closeDb,createJob,getJobById} from "./db";
import {appRouter} from "./routers";
import {checkMatchingWorkflows} from "./jobMatchingWorker";
import {checkAppointmentReminders} from "./appointmentRouter";
import {checkHomeMaintenance} from "./myHomeRouter";
import {reconcilePayment} from "./paymentReconciliation";
import {claimBookingCheckout} from "./instantBookingRouter";
import {instantSlots} from "../drizzle/schema";
import {sendNewJobPostedEmail} from "./email";
import {users,handymanProfiles,jobs,bids,payments,quotes,jobMatchRuns,jobMatchInvitations,notifications} from "../drizzle/schema";
import type {TrpcContext} from "./_core/context";
const run=process.env.GITHUB_ACTIONS==="true"&&process.env.SASKHANDY_V2_INTEGRATION==="1"&&(()=>{try{const u=new URL(process.env.DATABASE_URL??"");return u.hostname==="127.0.0.1"&&u.pathname==="/saskhandy_v2_integration_ci";}catch{return false;}})();
describe.skipIf(!run)("V2 real MySQL integration (isolated CI)",()=>{
 const ctx=(id:number,role:"homeowner"|"handyman"|"admin"="homeowner"):TrpcContext=>({user:{id,openId:"ci-"+id,name:"CI user "+id,email:null,role:role==="admin"?"admin":"user",userType:role==="admin"?"homeowner":role,emailVerified:true} as TrpcContext["user"],req:{} as TrpcContext["req"],res:{} as TrpcContext["res"]});
 const caller=(id:number,role:"homeowner"|"handyman"|"admin"="homeowner")=>appRouter.createCaller(ctx(id,role));
 const jobData={homeownerId:1,title:"Install shelves",description:"Install two shelves in the living room.",category:"Carpentry",location:"Saskatoon, SK"};
 beforeAll(async()=>{
  for(const flag of ["MATCHING","APPOINTMENTS","HOME","PRO","BOOKING"])vi.stubEnv("SASKHANDY_V2_"+flag,"1");
  const db=await getDb();
  await db.insert(users).values([{id:1,openId:"ci-1",name:"CI homeowner",userType:"homeowner",emailVerified:true},{id:2,openId:"ci-2",name:"CI professional",email:"ci-pro@example.invalid",userType:"handyman",emailVerified:true},{id:3,openId:"ci-3",name:"Other homeowner",userType:"homeowner",emailVerified:true},{id:4,openId:"ci-4",name:"Other professional",userType:"handyman",emailVerified:true},{id:5,openId:"ci-5",name:"CI admin",role:"admin",userType:"homeowner",emailVerified:true}]);
  await db.insert(handymanProfiles).values([{userId:2,bio:"Experienced carpenter providing home installation services.",categories:'["Carpentry"]',serviceArea:"Saskatoon",identityVerificationStatus:"approved",profileImageUrl:"https://example.invalid/p.png"},{userId:4,bio:"Experienced carpenter providing home installation services.",categories:'["Carpentry"]',serviceArea:"Regina",identityVerificationStatus:"approved",profileImageUrl:"https://example.invalid/p.png"}]);
 });
 afterAll(async()=>{vi.unstubAllEnvs();await closeDb();});
 it("queues matching, respects eligibility, retries a failed email and never duplicates the in-app invitation",async()=>{
  const db=await getDb(),id=await createJob(jobData,true);
  vi.mocked(sendNewJobPostedEmail).mockRejectedValueOnce(new Error("CI simulated mail outage"));
  await checkMatchingWorkflows(new Date(Date.now()+1000));
  let invite=await db.select().from(jobMatchInvitations).where(eq(jobMatchInvitations.jobId,id));
  expect(invite.map(i=>i.handymanId)).toEqual([2]);expect(invite[0].attempts).toBe(1);expect(invite[0].emailStatus).toBe("pending");
  await db.update(jobMatchInvitations).set({nextAttemptAt:new Date(Date.now()-1000)}).where(eq(jobMatchInvitations.jobId,id));
  await checkMatchingWorkflows(new Date(Date.now()+2000));
  invite=await db.select().from(jobMatchInvitations).where(eq(jobMatchInvitations.jobId,id));expect(invite).toHaveLength(1);expect(invite[0].emailStatus).toBe("sent");expect(invite[0].attempts).toBe(2);
  const notices=await db.select().from(notifications).where(and(eq(notifications.userId,2),eq(notifications.link,"/handyman/jobs/"+id)));expect(notices).toHaveLength(1);
  expect((await caller(1).jobs.matchingStatus({jobId:id}))?.invited).toBe(1);
  await expect(caller(3).jobs.matchingStatus({jobId:id})).rejects.toThrow();
  await expect(caller(1).admin.matchingHealth()).rejects.toThrow();
  expect(await caller(5,"admin").admin.matchingHealth()).not.toBeNull();
  await db.insert(bids).values({jobId:id,handymanId:2,bidAmount:"90.00"});
  await db.update(jobMatchRuns).set({nextRunAt:new Date(Date.now()-1000)}).where(eq(jobMatchRuns.jobId,id));
  await checkMatchingWorkflows();expect((await caller(1).jobs.matchingStatus({jobId:id}))?.status).toBe("quote_received");
 });
 it("handles no-quote exhaustion and does not notify closed requests",async()=>{
  const db=await getDb();const id=await createJob({...jobData,category:"Painting"},true);const closed=await createJob({...jobData,status:"cancelled"},true);
  await db.update(jobMatchRuns).set({wave:3,nextRunAt:new Date(Date.now()-1000)}).where(eq(jobMatchRuns.jobId,id));
  await checkMatchingWorkflows(new Date(Date.now()+1000));
  expect((await caller(1).jobs.matchingStatus({jobId:id}))?.status).toBe("no_quote");expect((await db.select().from(jobMatchRuns).where(eq(jobMatchRuns.jobId,closed)))[0].status).toBe("closed");
  await checkMatchingWorkflows(new Date(Date.now()+2000));expect(await db.select().from(notifications).where(and(eq(notifications.userId,1),eq(notifications.link,"/jobs/"+id)))).toHaveLength(1);
 });
 it("enforces two-party appointments, rejects overlap, preserves job/payment when cancelled and sends one reminder",async()=>{
  const db=await getDb();const id=await createJob({...jobData,status:"in_progress",selectedHandymanId:2});const otherId=await createJob({...jobData,homeownerId:3,status:"in_progress",selectedHandymanId:2});
  await db.insert(payments).values({jobId:id,homeownerId:1,handymanId:2,amount:"100.00",platformFee:"20.00",handymanPayout:"80.00",status:"completed"});
  const start=new Date(Date.now()+3*3600000),end=new Date(start.getTime()+3600000),input={jobId:id,version:0,startAt:start.toISOString(),endAt:end.toISOString()};
  await expect(caller(3).appointments.propose(input)).rejects.toThrow();await caller(1).appointments.propose(input);await expect(caller(1).appointments.respond({jobId:id,version:1,accept:true})).rejects.toThrow();await caller(2,"handyman").appointments.respond({jobId:id,version:1,accept:true});
  expect((await caller(1).appointments.getForJob({jobId:id})).appointment?.status).toBe("confirmed");
  await caller(3).appointments.propose({...input,jobId:otherId});await expect(caller(2,"handyman").appointments.respond({jobId:otherId,version:1,accept:true})).rejects.toThrow();
  await checkAppointmentReminders(new Date());await checkAppointmentReminders(new Date());
  const reminders=await db.select().from(notifications).where(eq(notifications.title,"Your appointment is coming up"));expect(reminders).toHaveLength(2);
  await caller(1).appointments.cancel({jobId:id,version:2});expect((await getJobById(id))?.status).toBe("in_progress");expect((await db.select().from(payments).where(eq(payments.jobId,id)))[0].status).toBe("completed");
 });
 it("isolates saved professionals and maintenance tasks by homeowner",async()=>{
  await caller(1).myHome.addProperty({label:"Home",city:"Saskatoon"});const p=(await caller(1).myHome.overview()).properties[0];expect(p).toBeDefined();
  await expect(caller(3).myHome.addTask({propertyId:p.id,title:"Furnace filter",dueDate:"2026-01-01"})).rejects.toThrow();
  await caller(1).myHome.addTask({propertyId:p.id,title:"Furnace filter",dueDate:"2026-01-01"});
  await caller(1).myHome.save({handymanId:2,saved:true});await caller(1).myHome.save({handymanId:2,saved:true});
  expect((await caller(1).myHome.overview()).saved).toHaveLength(1);expect((await caller(3).myHome.overview()).properties).toHaveLength(0);
  const t=(await caller(1).myHome.overview()).maintenance[0];await caller(3).myHome.completeTask({id:t.id,completed:true});expect((await caller(1).myHome.overview()).maintenance[0].completed).toBe(false);
  await checkHomeMaintenance(new Date("2026-02-01T12:00:00Z"));await checkHomeMaintenance(new Date("2026-02-01T12:00:00Z"));
  const db=await getDb();expect(await db.select().from(notifications).where(and(eq(notifications.userId,1),eq(notifications.title,"Home maintenance reminder")))).toHaveLength(1);
 });
 it("keeps quote templates and customer information private",async()=>{
  const db=await getDb();const [q]=await db.insert(quotes).values({handymanId:2,sourceType:"handyman_customer",homeownerName:"CI customer",homeownerEmail:"customer@example.invalid",title:"Repair",scope:"Repair a cabinet",subtotal:"100.00",totalAmount:"100.00",platformFeeRate:"0.00",platformFeeAmount:"0.00",status:"paid",publicToken:"x".repeat(64)});
  const quoteId=Number(q.insertId);
  await expect(caller(4,"handyman").proTools.saveTemplate({quoteId,name:"Repair"})).rejects.toThrow();
  await caller(2,"handyman").proTools.saveTemplate({quoteId,name:"Cabinet repair"});const overview=await caller(2,"handyman").proTools.overview();
  expect(overview.templates).toHaveLength(1);expect(overview.templates[0]).not.toHaveProperty("homeownerEmail");expect(overview.templates[0]).not.toHaveProperty("publicToken");expect(overview.summary?.paidAmount).toBe(100);
  expect((await caller(4,"handyman").proTools.overview()).customers).toHaveLength(0);await expect(caller(1).proTools.overview()).rejects.toThrow();
 });
 it("reserves one fixed-price slot and reconciles only the exact paid intent",async()=>{
  const db=await getDb();await db.update(handymanProfiles).set({categories:'["Carpentry","General Helper"]'}).where(eq(handymanProfiles.userId,2));
  const start=new Date(Date.now()+30*3600000),end=new Date(start.getTime()+3600000);
  await caller(2,"handyman").instantBooking.publish({service:"assembly",scope:"One small table, instructions provided",price:100,startAt:start.toISOString(),endAt:end.toISOString()});
  const slot=(await caller(1).instantBooking.catalog()).slots[0];expect(slot).toBeDefined();
  const input={id:slot.id,expectedPrice:100,acceptedScope:true as const};
  const results=await Promise.allSettled([caller(1).instantBooking.reserve(input),caller(3).instantBooking.reserve(input)]);
  const winners=results.filter(r=>r.status==="fulfilled");expect(winners).toHaveLength(1);const jobId=(winners[0] as PromiseFulfilledResult<{jobId:number}>).value.jobId;
  const job=await getJobById(jobId);expect(job?.status).toBe("awaiting_payment");const owner=job!.homeownerId;
  expect((await caller(owner).instantBooking.reserve(input)).jobId).toBe(jobId);
  await claimBookingCheckout(jobId,owner);await expect(caller(owner).instantBooking.cancelHold({jobId})).rejects.toThrow();
  await db.update(payments).set({stripePaymentIntentId:"pi_ci_booking"}).where(eq(payments.jobId,jobId));
  const intent={id:"pi_ci_booking",amount:10000,amount_received:10000,currency:"cad",status:"succeeded",metadata:{jobId:String(jobId),homeownerId:String(owner),handymanId:"2"}};
  expect(await reconcilePayment({...intent,amount_received:99})).toBe("ignored");expect((await getJobById(jobId))?.status).toBe("awaiting_payment");
  expect(await reconcilePayment(intent)).toBe("applied");expect((await getJobById(jobId))?.status).toBe("in_progress");
  expect(await reconcilePayment({...intent,status:"requires_payment_method"})).toBe("ignored");expect(await reconcilePayment(intent)).toBe("ignored");
  expect((await getJobById(jobId))?.status).toBe("in_progress");
 });
 it("cancels an unpaid reservation without moving money",async()=>{
  const db=await getDb(),start=new Date(Date.now()+48*3600000),end=new Date(start.getTime()+3600000);
  await caller(2,"handyman").instantBooking.publish({service:"assembly",scope:"One small shelf kit, no anchoring",price:80,startAt:start.toISOString(),endAt:end.toISOString()});
  const slot=(await caller(1).instantBooking.catalog()).slots.find(s=>Number(s.price)===80)!;
  const {jobId}=await caller(1).instantBooking.reserve({id:slot.id,expectedPrice:80,acceptedScope:true});
  await expect(caller(3).instantBooking.cancelHold({jobId})).rejects.toThrow();
  await caller(1).instantBooking.cancelHold({jobId});
  expect((await getJobById(jobId))?.status).toBe("cancelled");const [payment]=await db.select().from(payments).where(eq(payments.jobId,jobId));expect(payment.stripePaymentIntentId).toBeNull();expect(payment.status).toBe("failed");
 });

});
