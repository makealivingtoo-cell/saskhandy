import { createConnection } from 'mysql2/promise';

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.execute("SHOW TABLES") as any;
  console.log('Tables:', rows.map((r: any) => Object.values(r)[0]));
  await conn.end();
}

main().catch(console.error);
