export const MATCH_WAVE_SIZE=5;
export const MATCH_WAVE_DELAYS_MS=[0,4*60*60*1000,12*60*60*1000,24*60*60*1000] as const;
export function nextMatchingCheck(startedAt:Date,wave:number):Date|null {
  if(!Number.isInteger(wave)||wave<0||wave>=MATCH_WAVE_DELAYS_MS.length)return null;
  return new Date(startedAt.getTime()+MATCH_WAVE_DELAYS_MS[wave]);
}
export function invitationRetryAt(now:Date,attempt:number):Date|null {
  if(attempt>=3)return null;
  return new Date(now.getTime()+Math.max(1,attempt)*15*60*1000);
}
export function chooseInvitationIds(eligible:number[],invited:number[],limit=MATCH_WAVE_SIZE):number[] {
  const seen=new Set(invited);
  return [...new Set(eligible)].filter(id=>Number.isSafeInteger(id)&&id>0&&!seen.has(id)).slice(0,limit);
}
