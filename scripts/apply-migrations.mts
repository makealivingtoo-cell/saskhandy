import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL!);
  
  // Read migration 0001 SQL
  const sql0001 = readFileSync('drizzle/0001_spooky_blink.sql', 'utf-8');
  
  // Split by statement-breakpoint
  const statements = sql0001.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  
  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
      console.log('OK:', stmt.substring(0, 60));
    } catch(e: any) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_FIELDNAME') {
        console.log('Skip (exists):', stmt.substring(0, 60));
      } else {
        console.error('Error:', e.message, '\nSQL:', stmt.substring(0, 100));
      }
    }
  }
  
  // Apply migration 0002
  try {
    await conn.execute("ALTER TABLE `handyman_profiles` MODIFY COLUMN `categories` text DEFAULT '[]'");
    console.log('OK: 0002 - categories column altered');
  } catch(e: any) {
    console.log('0002 note:', e.message);
  }
  
  // Check tables now
  const [rows] = await conn.execute("SHOW TABLES") as any;
  console.log('\nFinal tables:', rows.map((r: any) => Object.values(r)[0]));
  
  await conn.end();
}

main().catch(console.error);
