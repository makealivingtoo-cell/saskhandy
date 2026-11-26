import mysql from "mysql2/promise";
import {randomBytes,scryptSync} from "node:crypto";
const url=new URL(process.env.DATABASE_URL??"");
if(process.env.SASKHANDY_STAGING_PREVIEW!=="1"||url.hostname!=="127.0.0.1"||url.pathname!=="/saskhandy_preview")throw Error("Refusing non-preview database");
const db=await mysql.createConnection(process.env.DATABASE_URL);
const hash=()=>{const salt=randomBytes(16).toString("hex");return salt+":"+scryptSync(process.env.STAGING_ACCESS_PASSWORD,salt,64).toString("hex");};
try{
 for(const [id,openId,name,email,role,type] of [[1,"preview-homeowner","Demo homeowner","homeowner@example.invalid","user","homeowner"],[2,"preview-pro-1","Demo professional","professional@example.invalid","user","handyman"],[3,"preview-admin","Demo administrator","admin@example.invalid","admin","homeowner"],[4,"preview-pro-2","Demo professional B","professional-b@example.invalid","user","handyman"],[5,"preview-pro-3","Demo professional C","professional-c@example.invalid","user","handyman"]]){
  await db.execute("INSERT INTO users (id,openId,name,email,passwordHash,loginMethod,role,userType,emailVerified,emailVerifiedAt) VALUES (?,?,?,?,?,'local',?,?,1,NOW())",[id,openId,name,email,hash(),role,type]);
 }
 for(const id of [2,4,5]){
  await db.execute("INSERT INTO handyman_profiles (userId,bio,categories,serviceArea,identityVerificationStatus,profileImageUrl,hourlyRate) VALUES (?,?,?,'Saskatoon','approved','/staging-demo-profile.svg',?)",[id,"Fictional preview professional for testing household projects.",JSON.stringify(["General Helper","Cleaning","Carpentry","Landscaping","Painting"]),String(45+id*5)]);
  await db.execute("INSERT INTO instant_slots (handymanId,service,scope,price,startAt,endAt) VALUES (?,'assembly','One small freestanding flat-pack item; all parts provided',?,DATE_ADD(NOW(),INTERVAL 2 DAY),DATE_ADD(DATE_ADD(NOW(),INTERVAL 2 DAY),INTERVAL 1 HOUR))",[id,String(60+id*10)]);
 }
 const [result]=await db.execute("INSERT INTO jobs (homeownerId,title,description,category,location,budgetMin,budgetMax) VALUES (1,'Demo: assemble a side table','Fictional project: assemble a small freestanding table. Parts are ready.','General Helper','Saskatoon, SK',60,120)");
 for(const [id,price] of [[2,80],[4,95]])await db.execute("INSERT INTO bids (jobId,handymanId,bidAmount,message,availability) VALUES (?,?,?,'Includes assembly and cleanup','This weekend')",[result.insertId,id,price]);
 await db.execute("INSERT INTO saved_professionals (homeownerId,handymanId) VALUES (1,2)");
 await db.execute("INSERT INTO home_properties (homeownerId,label,city) VALUES (1,'Demo home','Saskatoon')");
 console.log("Synthetic staging data initialized.");
}finally{await db.end();}
