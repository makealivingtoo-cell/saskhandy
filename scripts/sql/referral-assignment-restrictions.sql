CREATE TABLE IF NOT EXISTS `referral_assignment_restrictions` (
  `userId` int NOT NULL PRIMARY KEY,
  `status` enum('active','suspended','blocked') NOT NULL DEFAULT 'active',
  `updatedBy` int NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
