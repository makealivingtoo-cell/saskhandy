import "dotenv/config";
import {createConnection} from "mysql2/promise";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const db=await createConnection(process.env.DATABASE_URL);
try{
 await db.query("CREATE TABLE IF NOT EXISTS job_appointments (jobId INT PRIMARY KEY,homeownerId INT NOT NULL,handymanId INT NOT NULL,status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',startAt TIMESTAMP NULL,endAt TIMESTAMP NULL,proposedStartAt TIMESTAMP NULL,proposedEndAt TIMESTAMP NULL,proposedBy INT NULL,version INT NOT NULL DEFAULT 1,reminderSentAt TIMESTAMP NULL,createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,KEY appointment_pro_schedule(handymanId,status,startAt),KEY appointment_home_schedule(homeownerId,status,startAt)) ENGINE=InnoDB");
 await db.query("CREATE TABLE IF NOT EXISTS professional_availability (handymanId INT PRIMARY KEY,acceptingJobs BOOLEAN NOT NULL DEFAULT TRUE,updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB");
 console.log("Appointment and availability tables ready; existing jobs and payments unchanged.");
}finally{await db.end();}
