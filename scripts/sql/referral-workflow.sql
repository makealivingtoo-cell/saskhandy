-- Additive and safe to run repeatedly. Does not edit referral, quote, or payment records.
CREATE TABLE IF NOT EXISTS referral_workflow_events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  referralJobId INT NOT NULL,
  actorUserId INT NOT NULL,
  type ENUM('outreach','contacted','inspection','note') NOT NULL,
  note TEXT NOT NULL,
  scheduledFor TIMESTAMP NULL,
  privateToAdmin TINYINT(1) NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY referral_workflow_events_job_created_idx (referralJobId, createdAt)
);
