export function refundSplit(original:number,fee:number,refund:number){
 if(![original,fee,refund].every(Number.isSafeInteger)||original<=0||fee<0||fee>original||refund<=0||refund>original)throw Error("Invalid refund amounts");
 const remaining=original-refund,remainingFee=Math.round(remaining*fee/original);
 return {remaining,remainingFee,payout:remaining-remainingFee};
}
