import "dotenv/config";
import {createConnection} from "mysql2/promise";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const db=await createConnection(process.env.DATABASE_URL);
try{
 await db.query("CREATE TABLE IF NOT EXISTS job_match_runs (jobId INT PRIMARY KEY,wave INT NOT NULL DEFAULT 0,status ENUM('searching','quote_received','no_quote','closed') NOT NULL DEFAULT 'searching',startedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,nextRunAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,KEY job_match_due_idx(status,nextRunAt)) ENGINE=InnoDB");
 await db.query("CREATE TABLE IF NOT EXISTS job_match_invitations (id INT AUTO_INCREMENT PRIMARY KEY,jobId INT NOT NULL,handymanId INT NOT NULL,emailStatus ENUM('pending','sending','sent','failed','skipped') NOT NULL DEFAULT 'pending',attempts INT NOT NULL DEFAULT 0,nextAttemptAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE KEY job_match_unique_invite(jobId,handymanId),KEY job_match_email_due_idx(emailStatus,nextAttemptAt)) ENGINE=InnoDB");
 console.log("V2 matching tables ready. Existing job and payment records unchanged.");
}finally{await db.end();}
