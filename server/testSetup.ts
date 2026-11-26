import {vi} from "vitest";
// Unit tests must never contact Stripe. Tests that need simulated results can
// configure these mocks explicitly; an unexpected provider call fails closed.
vi.mock("./stripe",()=>{
 const blocked=()=>vi.fn(async()=>{throw new Error("External Stripe calls are disabled in unit tests");});
 return {stripe:{paymentIntents:{create:blocked(),retrieve:blocked(),cancel:blocked()},refunds:{create:blocked()},accounts:{create:blocked(),retrieve:blocked()},transfers:{create:blocked()},accountLinks:{create:blocked()}},
 createPaymentIntent:blocked(),retrievePaymentIntent:blocked(),constructWebhookEvent:vi.fn(()=>{throw new Error("Unexpected webhook verification");}),createConnectedAccount:blocked(),createConnectedAccountOnboardingLink:blocked(),retrieveConnectedAccount:blocked(),createHandymanTransfer:blocked()};
});
vi.mock("./email",async importOriginal=>{
 const actual=await importOriginal<typeof import("./email")>();
 return Object.fromEntries(Object.entries(actual).map(([key,value])=>[key,key.startsWith("send")&&typeof value==="function"?vi.fn(async()=>{}):value]));
});
vi.mock("./sms",async importOriginal=>{
 const actual=await importOriginal<typeof import("./sms")>();
 return Object.fromEntries(Object.entries(actual).map(([key,value])=>[key,key.startsWith("send")&&typeof value==="function"?vi.fn(async()=>{}):value]));
});
