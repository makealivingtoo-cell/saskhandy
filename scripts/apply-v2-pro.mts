import "dotenv/config";
import {createConnection} from "mysql2/promise";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const db=await createConnection(process.env.DATABASE_URL);
try{await db.query("CREATE TABLE IF NOT EXISTS quote_templates (id INT AUTO_INCREMENT PRIMARY KEY,handymanId INT NOT NULL,name VARCHAR(100) NOT NULL,title VARCHAR(255) NOT NULL,scope TEXT NOT NULL,lineItems TEXT NULL,subtotal DECIMAL(10,2) NOT NULL,gstRate DECIMAL(5,2) NULL,pstRate DECIMAL(5,2) NULL,createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,KEY quote_templates_owner_idx(handymanId)) ENGINE=InnoDB");console.log("Quote templates ready. Existing quote and payment rows unchanged.");}finally{await db.end();}
