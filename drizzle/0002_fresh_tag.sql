CREATE TABLE `platform_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`target` text,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `platform_audit_created` ON `platform_audit` (`created`);--> statement-breakpoint
CREATE TABLE `platform_content` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `platform_content_kind_status` ON `platform_content` (`kind`,`status`);--> statement-breakpoint
CREATE TABLE `platform_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created` text NOT NULL,
	`last_seen` text NOT NULL,
	`terms_version` text,
	`preferences` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `platform_users_status_created` ON `platform_users` (`status`,`created`);