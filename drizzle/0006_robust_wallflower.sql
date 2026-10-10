CREATE TABLE `platform_roles` (
	`owner` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL CHECK (`role` IN ('USER','SUPER_ADMIN')),
	`provisioned_by` text DEFAULT 'registration' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `platform_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `auth_revoked_sessions` (
	`issuer` text NOT NULL,
	`session` text NOT NULL,
	`subject` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `revoked_session_key` ON `auth_revoked_sessions` (`issuer`,`session`);
--> statement-breakpoint
INSERT OR IGNORE INTO platform_roles(owner,role,provisioned_by,created) SELECT id,'USER','migration',created FROM platform_users;
