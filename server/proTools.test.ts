import {describe,it,expect} from "vitest";
import {groupCustomers,quoteSummary,parseTemplateLines} from "../shared/proTools";
describe("professional tools",()=>{
 const row={id:1,homeownerName:"A",homeownerEmail:null,homeownerPhone:null,title:"Repair",totalAmount:"100.01",status:"paid",updatedAt:new Date()};
 it("does not merge customers by name alone",()=>expect(groupCustomers([row,{...row,id:2}])).toHaveLength(2));
 it("groups exact normalized email",()=>expect(groupCustomers([{...row,homeownerEmail:"A@EXAMPLE.COM"},{...row,id:2,homeownerEmail:"a@example.com"}])).toHaveLength(1));
 it("counts only paid and completed gross values",()=>expect(quoteSummary([row,{...row,status:"completed",totalAmount:"10.02"},{...row,status:"draft"}])).toEqual({total:3,paid:2,awaiting:0,paidAmount:110.03}));
 it("rejects malformed template pricing",()=>expect(parseTemplateLines('[{"description":"Test","quantity":0,"unitPrice":50}]')).toEqual([]));
});
