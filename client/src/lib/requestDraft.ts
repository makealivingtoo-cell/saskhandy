// Carry only an unsubmitted description across same-tab authentication, never in a URL.
const KEY="saskhandy-request-start-v2";
export function saveRequestStart(idea:string):void { try {sessionStorage.setItem(KEY,JSON.stringify({idea:idea.trim().slice(0,2000),at:Date.now()}));} catch{} }
export function readRequestStart():string|null {
  try { const v=JSON.parse(sessionStorage.getItem(KEY)??"null"); if(v&&typeof v.idea==="string"&&typeof v.at==="number"&&Date.now()-v.at>=0&&Date.now()-v.at<3600000)return v.idea;sessionStorage.removeItem(KEY); } catch{}
  return null;
}
export function clearRequestStart():void {try{sessionStorage.removeItem(KEY);}catch{}}

const BOOK_KEY="saskhandy-book-return";
export function rememberBookingReturn(){try{sessionStorage.setItem(BOOK_KEY,String(Date.now()));}catch{}}
export function consumeBookingReturn(){try{const value=sessionStorage.getItem(BOOK_KEY);sessionStorage.removeItem(BOOK_KEY);return !!value&&Date.now()-Number(value)>=0&&Date.now()-Number(value)<3600000;}catch{return false;}}
