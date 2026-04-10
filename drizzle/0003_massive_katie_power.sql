CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`readBy` varchar(1000) DEFAULT '[]',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `handyman_profiles` MODIFY COLUMN `categories` varchar(1000) DEFAULT '[]';