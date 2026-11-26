import assert from "node:assert/strict";
import {chromium} from "playwright";
import {SignJWT} from "jose";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
assert.equal(process.env.GITHUB_ACTIONS,"true");
assert.equal(process.env.SASKHANDY_V2_BROWSER_TEST,"1");
const db=new URL(process.env.DATABASE_URL??"");
assert.equal(db.hostname,"127.0.0.1");assert.equal(db.pathname,"/saskhandy_v2_integration_ci");
const origin="http://127.0.0.1:4179",secret="ci-only-session-key-not-for-production-2026";
const server=spawn(process.execPath,["dist/index.js"],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:"production",GITHUB_ACTIONS:"true",SASKHANDY_V2_BROWSER_TEST:"1",DATABASE_URL:process.env.DATABASE_URL,PORT:"4179",APP_URL:origin,JWT_SECRET:secret,STRIPE_SECRET_KEY:"sk_test_ci_placeholder_do_not_use",SASKHANDY_V2_MATCHING:"1",SASKHANDY_V2_APPOINTMENTS:"1",SASKHANDY_V2_HOME:"1",SASKHANDY_V2_PRO:"1",SASKHANDY_V2_BOOKING:"1"},stdio:"inherit"});
const output="artifacts/v2-browser";await mkdir(output,{recursive:true});
let browser;const report=[];
try{
 let ready=false;for(let i=0;i<60;i++){try{const response=await fetch(origin+"/book");if(response.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert(ready,"Local test server not ready");
 browser=await chromium.launch({headless:true});
 for(const [label,width,height] of [["mobile",390,844],["desktop",1440,900]]){
  for(const [role,user,paths] of [
   ["guest",null,[["/","What do you need help with?"],["/sign-in","password"],["/sign-up","Join SaskHandy"],["/book","Book local help"]]],
   ["homeowner","ci-1",[["/dashboard","Good"],["/post-job","Request help"],["/my-home","My Home"],["/book","Book local help"],["/support","How can we help?"]]],
   ["professional","ci-2",[["/handyman/dashboard","SaskHandy referrals"],["/handyman/browse","Jobs"],["/handyman/bids","My marketplace quotes"],["/handyman/profile","My Profile"]]],
   ["admin","ci-5",[["/admin","Admin Panel"]]]
  ]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:"reduce"});
   await context.route("**/*",route=>route.request().url().startsWith(origin+"/")?route.continue():route.abort());
   if(user){const token=await new SignJWT({openId:user,name:"CI user"}).setProtectedHeader({alg:"HS256",typ:"JWT"}).setExpirationTime("10m").sign(new TextEncoder().encode(secret));await context.addCookies([{name:"app_session_id",value:token,url:origin,httpOnly:true,sameSite:"Lax"}]);}
   const page=await context.newPage();
   let errors=[];page.on("pageerror",e=>errors.push(e.message));
   for(const [path,marker] of paths){
    errors=[];const key=label+"-"+role+"-"+(path==="/"?"home":path.slice(1).replaceAll("/","-"));let status,problem=null,overflow=0;
    try{const response=await page.goto(origin+path,{waitUntil:"domcontentloaded",timeout:20000});status=response?.status();assert.equal(status,200);await page.getByText(marker,{exact:false}).first().waitFor({state:"visible",timeout:15000});await page.waitForTimeout(300);assert.equal(new URL(page.url()).pathname,path,"unexpected redirect");overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));if(errors.length)throw Error(errors.join("; "));}catch(e){problem=String(e);}
    await page.screenshot({path:output+"/"+key+".png",fullPage:true,timeout:15000}).catch(()=>{});
    report.push({viewport:label,role,path,status,overflow,problem});
   }
   await context.close();
  }
 }
 await writeFile(output+"/report.json",JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 assert.equal(report.filter(r=>r.problem).length,0,"Browser smoke route/render failures");
 assert.equal(report.filter(r=>r.overflow>4).length,0,"Horizontal page overflow; inspect screenshots");
}finally{await browser?.close();server.kill("SIGTERM");}
