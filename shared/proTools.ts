export type TemplateLine={description:string;quantity:number;unitPrice:number};
export function parseTemplateLines(raw:string|null):TemplateLine[]{
 try{const v:unknown=JSON.parse(raw??"[]");if(!Array.isArray(v))return [];return v.filter((item):item is TemplateLine=>item&&typeof item.description==="string"&&item.description.trim().length>0&&Number.isFinite(Number(item.quantity))&&Number(item.quantity)>0&&Number.isFinite(Number(item.unitPrice))&&Number(item.unitPrice)>=0).slice(0,100).map(item=>({description:item.description,quantity:Number(item.quantity),unitPrice:Number(item.unitPrice)}));}catch{return [];}
}
export type CustomerQuote={id:number;homeownerName:string;homeownerEmail:string|null;homeownerPhone:string|null;title:string;totalAmount:string;status:string;updatedAt:Date};
export function groupCustomers(rows:CustomerQuote[]){
 const groups=new Map<string,{key:string;name:string;email:string|null;phone:string|null;quotes:CustomerQuote[]}>();
 for(const row of rows){
  const email=row.homeownerEmail?.trim().toLowerCase()||null;
  const phone=row.homeownerPhone?.replace(/\D/g,"")||null;
  // Never merge people based on a similar name, or infer email/phone ownership.
  const key=email?"email:"+email:phone?"phone:"+phone:"quote:"+row.id;
  let group=groups.get(key);if(!group){group={key,name:row.homeownerName,email:row.homeownerEmail,phone:row.homeownerPhone,quotes:[]};groups.set(key,group);}
  group.quotes.push(row);
 }
 return Array.from(groups.values());
}
export function quoteSummary(rows:{totalAmount:string;status:string}[]){
 const paid=rows.filter(r=>r.status==="paid"||r.status==="completed");
 return {total:rows.length,paid:paid.length,awaiting:rows.filter(r=>["sent","viewed","approved","payment_pending","payment_failed"].includes(r.status)).length,paidAmount:paid.reduce((sum,r)=>sum+Math.round(Number(r.totalAmount)*100),0)/100};
}
