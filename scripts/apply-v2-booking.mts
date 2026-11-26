import "dotenv/config";
import {createConnection} from "mysql2/promise";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const db=await createConnection(process.env.DATABASE_URL);
try{await db.query("CREATE TABLE IF NOT EXISTS instant_slots (id INT AUTO_INCREMENT PRIMARY KEY,handymanId INT NOT NULL,service VARCHAR(64) NOT NULL,scope TEXT NOT NULL,price DECIMAL(10,2) NOT NULL,startAt TIMESTAMP NOT NULL,endAt TIMESTAMP NOT NULL,status ENUM('available','reserved','withdrawn') NOT NULL DEFAULT 'available',jobId INT NULL,holdUntil TIMESTAMP NULL,checkoutStartedAt TIMESTAMP NULL,createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE KEY instant_slot_job_unique(jobId),KEY instant_slot_provider_idx(handymanId,status,startAt)) ENGINE=InnoDB");console.log("Instant booking table ready; legacy rows unchanged.");}finally{await db.end();}
