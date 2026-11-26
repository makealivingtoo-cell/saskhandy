import "dotenv/config";
import {createConnection,type RowDataPacket} from "mysql2/promise";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const db=await createConnection(process.env.DATABASE_URL);
try{
 const [rows]=await db.query<Array<RowDataPacket & {COLUMN_NAME:string;COLUMN_TYPE:string;IS_NULLABLE:string}>>("SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='jobs' AND COLUMN_NAME IN ('budgetMin','budgetMax')");
 if(rows.length!==2||rows.some(row=>row.COLUMN_TYPE.toLowerCase()!=="decimal(10,2)"))throw new Error("Unexpected budget schema; no changes made");
 const changes=rows.filter(row=>row.IS_NULLABLE!=="YES").map(row=>"MODIFY COLUMN "+(row.COLUMN_NAME==="budgetMin"?"budgetMin":"budgetMax")+" DECIMAL(10,2) NULL DEFAULT NULL");
 if(changes.length)await db.query("ALTER TABLE jobs "+changes.join(", "));
 console.log("Budget nullability checked; existing values preserved.");
}finally{await db.end();}
