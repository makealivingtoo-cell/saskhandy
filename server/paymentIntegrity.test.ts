import {describe,it,expect} from "vitest";
import {matchesIntent,acceptsJobPayment,acceptsQuotePayment} from "../shared/paymentIntegrity";
import {priceRange,splitPrice,validSlotPrice} from "../shared/instantBooking";
describe("payment integrity",()=>{
 const expected={id:"pi_ci",amount:"100.00",jobId:1,handymanId:2,homeownerId:3};
 const intent={id:"pi_ci",amount:10000,amount_received:10000,currency:"cad",status:"succeeded",metadata:{jobId:"1",handymanId:"2",homeownerId:"3"}};
 it("checks exact amount, currency, ID and metadata",()=>{expect(matchesIntent(intent,expected)).toBe(true);for(const change of [{id:"pi_old"},{currency:"usd"},{amount_received:9999},{amount:9999},{metadata:{...intent.metadata,handymanId:"99"}}])expect(matchesIntent({...intent,...change},expected)).toBe(false);expect(matchesIntent(intent,{...expected,id:null})).toBe(false);});
 it("never reopens active or terminal transactions",()=>{expect(acceptsJobPayment("awaiting_payment","pending")).toBe(true);for(const s of ["in_progress","completed","disputed","cancelled"])expect(acceptsJobPayment(s,"pending")).toBe(false);expect(acceptsJobPayment("awaiting_payment","refunded")).toBe(false);expect(acceptsQuotePayment("completed")).toBe(false);});
});
describe("fixed-price service guidance",()=>{
 it("requires three real distinct providers",()=>{expect(priceRange([{handymanId:1,price:100},{handymanId:1,price:80},{handymanId:2,price:90}])).toBeNull();expect(priceRange([{handymanId:1,price:100},{handymanId:1,price:80},{handymanId:2,price:90},{handymanId:3,price:110}])).toEqual({min:80,max:110,providers:3});});
 it("uses cents with no rounding loss",()=>{expect(splitPrice(100.03)).toEqual({amount:"100.03",platformFee:"20.01",handymanPayout:"80.02"});expect(validSlotPrice(100.001)).toBe(false);});
});
