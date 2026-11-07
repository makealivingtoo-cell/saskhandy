import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createConnection, type RowDataPacket } from "mysql2/promise";

// Only drop tables in the isolated GitHub Actions MySQL database.
const url = new URL(process.env.DATABASE_URL ?? "");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.pathname, "/referral_workflow_ci");
const connection = await createConnection(process.env.DATABASE_URL!);
const migrate = () => execFileSync("pnpm", ["db:referral-workflow"], { stdio: "inherit", env: process.env });
try {
  await connection.query("DROP TABLE IF EXISTS referral_workflow_events");
  await connection.query(`CREATE TABLE referral_workflow_events (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    referralJobId int NOT NULL,
    actorId int NOT NULL,
    candidateId int,
    kind enum('customer_contacted','visit_booked','note','outreach_sent','interested','unavailable') NOT NULL,
    note text NOT NULL,
    adminOnly boolean NOT NULL DEFAULT true,
    scheduledAt timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY referral_workflow_referral_idx (referralJobId)
  )`);
  await connection.query(`INSERT INTO referral_workflow_events
    (referralJobId, actorId, candidateId, kind, note, adminOnly, scheduledAt)
    VALUES (3,12,55,'outreach_sent','Private outreach',1,NULL),
      (3,14,NULL,'customer_contacted','Homeowner called',0,NULL),
      (3,12,NULL,'visit_booked','Inspection booked',1,'2026-11-10 16:00:00'),
      (3,14,NULL,'unavailable','Unavailable',1,NULL)`);
  migrate();
  migrate();
  const [events] = await connection.query<Array<RowDataPacket & {
    id: number; actorId: number | null; actorUserId: number;
    kind: string | null; type: string; candidateId: number | null;
    adminOnly: number; privateToAdmin: number; scheduledFor: Date | null;
  }>>("SELECT id,actorId,actorUserId,kind,type,candidateId,adminOnly,privateToAdmin,scheduledFor FROM referral_workflow_events ORDER BY id");
  assert.equal(events.length,4);
  assert.deepEqual(events.map(r=>r.actorUserId),[12,14,12,14]);
  assert.deepEqual(events.map(r=>r.type),["outreach","contacted","inspection","outreach"]);
  assert.deepEqual(events.map(r=>r.privateToAdmin),[1,0,1,1]);
  assert.equal(events[0].candidateId,55);
  assert(events[2].scheduledFor instanceof Date);
  assert.equal(events[3].kind,"unavailable");

  // New app writes must work despite old non-null columns.
  await connection.query(`INSERT INTO referral_workflow_events
    (referralJobId,actorUserId,type,note,privateToAdmin)
    VALUES (3,18,'note','New progress note',1)`);
  const [inserted] = await connection.query<Array<RowDataPacket & { actorId: number | null; kind: string | null }>>(
    "SELECT actorId,kind FROM referral_workflow_events WHERE note='New progress note'");
  assert.equal(inserted.length,1);
  assert.equal(inserted[0].actorId,null);
  assert.equal(inserted[0].kind,null);

  // A brand new deployment and repeated migration also work.
  await connection.query("DROP TABLE IF EXISTS referral_workflow_events");
  migrate();
  migrate();
  await connection.query(`INSERT INTO referral_workflow_events
    (referralJobId,actorUserId,type,note,privateToAdmin) VALUES (5,19,'note','Clean install',1)`);
  console.log("PASS: legacy migration, privacy, idempotence and clean install");
} finally {
  await connection.end();
}
