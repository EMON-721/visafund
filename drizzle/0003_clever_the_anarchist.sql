CREATE TABLE `platform_deletion_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`target` text NOT NULL,
	`status` text NOT NULL,
	`eligible_after` text NOT NULL,
	`created` text NOT NULL,
	`policy_version` text NOT NULL,
	`requested_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `platform_deletion_jobs_status` ON `platform_deletion_jobs` (`status`,`eligible_after`);