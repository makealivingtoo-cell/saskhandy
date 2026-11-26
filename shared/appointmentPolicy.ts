export function validAppointmentWindow(start:Date,end:Date,now:Date):boolean {
 const a=start.getTime(), b=end.getTime(), n=now.getTime();
 return Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(n)&&a>=n+15*60*1000&&a<=n+180*24*60*60*1000&&b-a>=30*60*1000&&b-a<=12*60*60*1000;
}
export function intervalsOverlap(aStart:Date,aEnd:Date,bStart:Date,bEnd:Date):boolean {
 return aStart<bEnd&&bStart<aEnd;
}
export function canRespondToProposal(actor:number,proposer:number|null,version:number,expectedVersion:number):boolean{
 return proposer!==null&&actor!==proposer&&version===expectedVersion;
}
