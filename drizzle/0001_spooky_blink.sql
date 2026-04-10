CREATE TABLE `bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`handymanId` int NOT NULL,
	`bidAmount` decimal(10,2) NOT NULL,
	`message` text,
	`availability` varchar(255),
	`status` enum('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`initiatedBy` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('open','resolved_release','resolved_refund') NOT NULL DEFAULT 'open',
	`adminNotes` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `handyman_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`categories` json DEFAULT ('[]'),
	`hourlyRate` decimal(10,2),
	`rating` decimal(3,2) DEFAULT '0.00',
	`totalJobs` int NOT NULL DEFAULT 0,
	`totalEarnings` decimal(12,2) DEFAULT '0.00',
	`verified` boolean NOT NULL DEFAULT false,
	`backgroundCheckPassed` boolean NOT NULL DEFAULT false,
	`insuranceVerified` boolean NOT NULL DEFAULT false,
	`insuranceCertUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `handyman_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homeownerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`location` varchar(255) NOT NULL,
	`budgetMin` decimal(10,2),
	`budgetMax` decimal(10,2),
	`status` enum('open','in_progress','completed','disputed','cancelled') NOT NULL DEFAULT 'open',
	`selectedHandymanId` int,
	`selectedBidId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`homeownerId` int NOT NULL,
	`handymanId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`handymanPayout` decimal(10,2) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeTransferId` varchar(255),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('homeowner','handyman','unset') DEFAULT 'unset' NOT NULL;