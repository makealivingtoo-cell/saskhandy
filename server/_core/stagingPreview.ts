import { timingSafeEqual } from "node:crypto";
import express, {type Express} from "express";
import {sdk} from "./sdk";
import {COOKIE_NAME} from "@shared/const";
export function installStagingPreview(app:Express){
 if(process.env.SASKHANDY_STAGING_PREVIEW!=="1")return;
 const database=new URL(process.env.DATABASE_URL??"");
 const password=process.env.STAGING_ACCESS_PASSWORD??"";
 if(database.hostname!=="127.0.0.1"||database.pathname!=="/saskhandy_preview"||password.length<24||!process.env.JWT_SECRET||process.env.STRIPE_SECRET_KEY!=="sk_test_preview_placeholder_not_valid"||process.env.SMTP_HOST||process.env.GROQ_API_KEY||process.env.CLOUDINARY_API_KEY||process.env.BREVO_API_KEY||process.env.TWILIO_AUTH_TOKEN)throw Error("Unsafe staging configuration; refusing startup.");
 const expected=Buffer.from("preview:"+password);
 app.use((req,res,next)=>{
  res.set({"X-Robots-Tag":"noindex, nofollow, noarchive","Cache-Control":"private, no-store"});
  if(req.path==="/__preview-health"){res.status(200).send("preview ready");return;}
  const auth=req.get("authorization")??"";
  const supplied=auth.startsWith("Basic ")?Buffer.from(auth.slice(6),"base64"):Buffer.alloc(0);
  if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected)){res.set("WWW-Authenticate",'Basic realm="SaskHandy private staging"');res.status(401).send("Private SaskHandy test environment");return;}
  next();
 });
 app.get("/robots.txt",(_req,res)=>res.type("text/plain").send("User-agent: *\nDisallow: /\n"));
 app.get("/__preview",(_req,res)=>res.type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SaskHandy 2.0 preview</title><style>body{font:16px system-ui;background:#f7f8f6;color:#164b35;margin:0;padding:32px}main{max-width:620px;margin:40px auto;background:white;border:1px solid #dfe5e0;border-radius:20px;padding:28px}button,a{font:inherit}button{display:block;width:100%;padding:14px;margin:12px 0;border:0;background:#164b35;color:white;border-radius:10px;cursor:pointer}p{line-height:1.55;color:#47564b}</style><main><h1>SaskHandy 2.0</h1><p>Private staging preview. All records are fictional and reset when this free service restarts. External payments, email, SMS, AI and file storage are not configured. Do not enter real customer or identity information.</p><form method="post" action="/__preview/session"><button name="role" value="homeowner">Explore as homeowner</button><button name="role" value="handyman">Explore as professional</button><button name="role" value="admin">Explore as administrator</button></form><a href="/">View homepage</a></main></html>`));
 app.post("/__preview/session",express.urlencoded({extended:false,limit:"1kb"}),async(req,res)=>{
  const origin=process.env.RENDER_EXTERNAL_URL||process.env.APP_URL;
  if(!origin||req.get("origin")!==new URL(origin).origin)return res.status(403).end();
  const roles={homeowner:{id:"preview-homeowner",name:"Demo homeowner",path:"/dashboard"},handyman:{id:"preview-pro-1",name:"Demo professional",path:"/handyman/dashboard"},admin:{id:"preview-admin",name:"Demo administrator",path:"/admin"}} as const;
  const key=req.body?.role;
  if(typeof key!=="string"||!Object.hasOwn(roles,key))return res.status(400).end();
  const role=roles[key as keyof typeof roles];
  const token=await sdk.createSessionToken(role.id,{name:role.name,expiresInMs:8*3600000});
  res.cookie(COOKIE_NAME,token,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:8*3600000});
  return res.redirect(303,role.path);
 });
}
