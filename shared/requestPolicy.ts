export function canSeeDirectedJob(job:{homeownerId:number;requestedHandymanId?:number|null},user?:{id:number;role:string}|null){return !job.requestedHandymanId||user?.role==="admin"||user?.id===job.homeownerId||user?.id===job.requestedHandymanId;}
export function historicalRange(rows:{amount:string;handymanId:number;jobId:number}[]){
 const unique=new Map<number,{amount:number;handymanId:number}>();for(const row of rows){const a=Number(row.amount);if(Number.isFinite(a)&&a>0&&!unique.has(row.jobId))unique.set(row.jobId,{amount:a,handymanId:row.handymanId});}
 const items=[...unique.values()];if(items.length<5||new Set(items.map(i=>i.handymanId)).size<3)return null;
 const values=items.map(i=>i.amount).sort((a,b)=>a-b);
 return {low:Math.floor(values[Math.floor((values.length-1)*.25)]/5)*5,high:Math.ceil(values[Math.ceil((values.length-1)*.75)]/5)*5,sample:items.length};
}
