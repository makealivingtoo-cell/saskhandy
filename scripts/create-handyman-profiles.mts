import { createConnection } from 'mysql2/promise';

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL!);
  
  const sql = `CREATE TABLE IF NOT EXISTS \`handyman_profiles\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`bio\` text,
    \`categories\` varchar(1000) DEFAULT '[]',
    \`hourlyRate\` decimal(10,2),
    \`rating\` decimal(3,2) DEFAULT '0.00',
    \`totalJobs\` int NOT NULL DEFAULT 0,
    \`totalEarnings\` decimal(12,2) DEFAULT '0.00',
    \`verified\` boolean NOT NULL DEFAULT false,
    \`backgroundCheckPassed\` boolean NOT NULL DEFAULT false,
    \`insuranceVerified\` boolean NOT NULL DEFAULT false,
    \`insuranceCertUrl\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`handyman_profiles_id\` PRIMARY KEY(\`id\`)
  )`;
  
  try {
    await conn.execute(sql);
    console.log('OK: handyman_profiles table created');
  } catch(e: any) {
    console.error('Error:', e.message);
  }
  
  const [rows] = await conn.execute("SHOW TABLES") as any;
  console.log('Tables:', rows.map((r: any) => Object.values(r)[0]));
  
  await conn.end();
}

main().catch(console.error);
