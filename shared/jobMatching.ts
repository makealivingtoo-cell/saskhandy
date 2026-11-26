// Conservative automatic invitations; marketplace browsing is unchanged.
type Profile = {categories?:string|null;serviceArea?:string|null;identityVerificationStatus?:string|null;tradeLicenseVerificationStatus?:string|null};
const clean = (v:string) => v.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function skills(raw?:string|null):string[] {
  if (!raw) return [];
  try { const a:unknown=JSON.parse(raw); return Array.isArray(a) ? a.filter((x):x is string=>typeof x==="string") : []; }
  catch { return raw.split(",").map(x=>x.trim()); }
}
const cities=["saskatoon","regina","moose jaw","prince albert","warman","martensville","osler","dalmeny","dundurn","langham","clavet","humboldt","north battleford","yorkton","swift current","estevan","weyburn","lloydminster","melfort","meadow lake","nipawin","rosetown","kindersley","biggar","delisle","viscount"];
const has=(s:string,p:string)=>(" "+s+" ").includes(" "+p+" ");
export function eligibleForJobInvitation(p:Profile,j:{category:string;location:string}):boolean {
  if(p.identityVerificationStatus!=="approved" || !skills(p.categories).some(s=>clean(s)===clean(j.category))) return false;
  if(["electrical","plumbing","hvac"].includes(clean(j.category)) && p.tradeLicenseVerificationStatus!=="approved") return false;
  const area=clean(p.serviceArea??""), loc=clean(j.location);
  if(!area||!loc) return false;
  const city=cities.find(c=>has(loc,c));
  return city ? has(area,city) : area===loc;
}
