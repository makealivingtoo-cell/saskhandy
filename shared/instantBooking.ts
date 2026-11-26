export const BOOKABLE_SERVICES = {
 assembly: {label:"Small furniture assembly",category:"General Helper",description:"Assembly of one small freestanding flat-pack item. Customer provides all parts and instructions. No wall anchoring, electrical work or furniture requiring two installers."},
 yard: {label:"Basic yard tidy-up",category:"Landscaping",description:"Up to the published appointment duration of light ground-level yard tidying. No tree climbing, hazardous materials, power equipment or hauling."},
 cleaning: {label:"Basic home cleaning",category:"Cleaning",description:"Light routine cleaning within the published appointment duration. No biohazards, mould, ladders or specialist cleaning."}
} as const;
export type BookableService=keyof typeof BOOKABLE_SERVICES;
export const bookingEnabled=()=>process.env.SASKHANDY_V2_BOOKING==="1"&&process.env.SASKHANDY_V2_APPOINTMENTS==="1";
export function validSlotPrice(price:number){return Number.isFinite(price)&&price>=25&&price<=1000&&Math.abs(price*100-Math.round(price*100))<0.000001;}
export function splitPrice(price:number){const cents=Math.round(price*100),fee=Math.round(cents*.2);return {amount:(cents/100).toFixed(2),platformFee:(fee/100).toFixed(2),handymanPayout:((cents-fee)/100).toFixed(2)};}
export function priceRange(rows:{handymanId:number;price:string|number}[]){
 const byPro=new Map<number,number>();for(const row of rows){const price=Number(row.price);if(validSlotPrice(price))byPro.set(row.handymanId,Math.min(byPro.get(row.handymanId)??Infinity,price));}
 if(byPro.size<3)return null;const p=Array.from(byPro.values());return {min:Math.min(...p),max:Math.max(...p),providers:byPro.size};
}
