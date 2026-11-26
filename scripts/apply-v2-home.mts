import "dotenv/config";
import {createConnection} from "mysql2/promise";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const db=await createConnection(process.env.DATABASE_URL);
try{
 await db.query("CREATE TABLE IF NOT EXISTS saved_professionals (id INT AUTO_INCREMENT PRIMARY KEY,homeownerId INT NOT NULL,handymanId INT NOT NULL,createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE KEY saved_professional_unique(homeownerId,handymanId)) ENGINE=InnoDB");
 await db.query("CREATE TABLE IF NOT EXISTS home_properties (id INT AUTO_INCREMENT PRIMARY KEY,homeownerId INT NOT NULL,label VARCHAR(100) NOT NULL,city VARCHAR(100) NOT NULL,createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,KEY home_properties_owner_idx(homeownerId)) ENGINE=InnoDB");
 await db.query("CREATE TABLE IF NOT EXISTS home_maintenance (id INT AUTO_INCREMENT PRIMARY KEY,homeownerId INT NOT NULL,propertyId INT NOT NULL,title VARCHAR(160) NOT NULL,dueDate DATE NOT NULL,completed BOOLEAN NOT NULL DEFAULT FALSE,reminderSentAt TIMESTAMP NULL,createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,KEY home_maintenance_owner_idx(homeownerId),KEY home_maintenance_due_idx(completed,dueDate)) ENGINE=InnoDB");
 console.log("My Home tables ready; no existing records modified.");
}finally{await db.end();}
