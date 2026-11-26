export type IntentRecord={id:string;amount:number;amount_received?:number;currency:string;status:string;metadata?:Record<string,string>};
export function matchesIntent(intent:IntentRecord,expected:{id:string|null;amount:string;jobId?:number;quoteId?:number;handymanId:number;homeownerId?:number}){
 const cents=Math.round(Number(expected.amount)*100);
 return !!expected.id&&intent.id===expected.id&&Number.isSafeInteger(cents)&&cents>=50&&intent.currency==="cad"&&intent.amount===cents&&
 (expected.jobId===undefined||intent.metadata?.jobId===String(expected.jobId))&&(expected.quoteId===undefined||intent.metadata?.quoteId===String(expected.quoteId))&&intent.metadata?.handymanId===String(expected.handymanId)&&(expected.homeownerId===undefined||intent.metadata?.homeownerId===String(expected.homeownerId))&&
 (intent.status!=="succeeded"||intent.amount_received===cents);
}
export function acceptsJobPayment(jobStatus:string,paymentStatus:string){return jobStatus==="awaiting_payment"&&["pending","failed"].includes(paymentStatus);}
export function acceptsQuotePayment(status:string){return ["approved","payment_pending","payment_failed"].includes(status);}
