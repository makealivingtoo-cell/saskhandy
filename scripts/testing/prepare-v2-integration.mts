import assert from "node:assert/strict";
import {createConnection} from "mysql2/promise";
import {execFileSync} from "node:child_process";
// Refuse to touch a production database, even if invoked accidentally.
assert.equal(process.env.GITHUB_ACTIONS,"true");
assert.equal(process.env.SASKHANDY_V2_INTEGRATION,"1");
const url=new URL(process.env.DATABASE_URL??"");
assert.equal(url.hostname,"127.0.0.1");
assert.equal(url.pathname,"/saskhandy_v2_integration_ci");
const db=await createConnection(process.env.DATABASE_URL!);
try{
 const [rows]=await db.query("SHOW TABLES");
 assert.equal((rows as unknown[]).length,0,"Integration database must be empty");
}finally{await db.end();}
execFileSync("pnpm",["exec","drizzle-kit","push","--force"],{stdio:"inherit",env:process.env});
