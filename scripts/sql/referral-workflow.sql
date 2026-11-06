CREATE TABLE IF NOT EXISTS `referral_workflow_events` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `referralJobId` int NOT NULL,
  `actorId` int NOT NULL,
  `candidateId` int,
  `kind` enum('customer_contacted','visit_booked','note','outreach_sent','interested','unavailable') NOT NULL,
  `note` text NOT NULL,
  `adminOnly` boolean NOT NULL DEFAULT true,
  `scheduledAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `referral_workflow_referral_idx` (`referralJobId`)
);
