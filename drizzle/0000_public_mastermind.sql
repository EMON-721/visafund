CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`bank` text NOT NULL,
	`currency` text NOT NULL,
	`opening` integer NOT NULL,
	`date` text NOT NULL,
	`details` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `accounts_owner` ON `accounts` (`owner`);--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`entity` text NOT NULL,
	`action` text NOT NULL,
	`before` text,
	`after` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_owner` ON `audit` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`details` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `documents_owner` ON `documents` (`owner`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `records_owner_kind` ON `records` (`owner`,`kind`);--> statement-breakpoint
CREATE TABLE `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`country` text NOT NULL,
	`data` text NOT NULL,
	`version` integer NOT NULL,
	`updated_by` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rules_country` ON `rules` (`country`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`account` text NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`direction` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`details` text NOT NULL,
	`fingerprint` text,
	`transfer` text,
	`imported` integer DEFAULT 0 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tx_owner_date` ON `transactions` (`owner`,`date`);--> statement-breakpoint
CREATE INDEX `tx_account_date` ON `transactions` (`account`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `tx_duplicate` ON `transactions` (`owner`,`fingerprint`);