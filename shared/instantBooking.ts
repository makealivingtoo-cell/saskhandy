export const BOOKABLE_SERVICES = {
 assembly: {label:"Small furniture assembly",category:"General Helper",description:"Assembly of one small freestanding flat-pack item. Customer provides all parts and instructions. No wall anchoring, electrical work or furniture requiring two installers."},
 yard: {label:"Basic yard tidy-up",category:"Landscaping",description:"Up to the published appointment duration of light ground-level yard tidying. No tree climbing, hazardous materials, power equipment or hauling."},
 assembly_large: {label:"Larger freestanding furniture assembly",category:"General Helper",description:"Pre-agreed freestanding flat-pack item(s); customer supplies complete parts and instructions. No wall anchoring or work requiring extra installers unless quoted separately."},
 snow: {label:"Ground-level snow clearing",category:"Landscaping",description:"Clear the stated driveway or walkway area using the agreed equipment. No roof snow removal or ice-dam work."},
 painting: {label:"Small interior paint touch-up",category:"Painting",description:"Pre-agreed ground-level touch-up of sound interior surfaces. No lead paint, mould, sanding of unknown coatings or high access."},
 drywall: {label:"Small cosmetic drywall patch",category:"Drywall",description:"Patch a pre-agreed small superficial hole on an accessible wall. No structural, water-damaged, electrical or concealed-service work."},
 carpentry: {label:"Minor freestanding wood repair",category:"Carpentry",description:"Pre-agreed repair of non-structural freestanding wood furniture. No structural work or load-bearing changes."},
 plumbing_assessment: {label:"Plumbing assessment visit",category:"Plumbing",description:"A fixed-price assessment only by a professional with reviewed trade credentials. Repair, parts, permits and further work require a separate quote."},
 electrical_assessment: {label:"Electrical assessment visit",category:"Electrical",description:"A fixed-price assessment only by a professional with reviewed trade credentials. Repair, parts, permits and further work require a separate quote."},
 hvac_assessment: {label:"Heating and cooling assessment visit",category:"HVAC",description:"A fixed-price assessment only by a professional with reviewed trade credentials. No repair or parts included; further work requires a separate quote."},
 roof_assessment: {label:"Roofing consultation",category:"Roofing",description:"Ground-level visual consultation only. No roof access, ladders, repair or certification. Further work requires a separate quote."},
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
