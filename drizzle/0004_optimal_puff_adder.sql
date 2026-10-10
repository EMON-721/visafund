CREATE TABLE `auth_flows` (
	`hash` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`session` text NOT NULL,
	`purpose` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_flows_expiry` ON `auth_flows` (`expires`);--> statement-breakpoint
CREATE TABLE `auth_identities` (
	`issuer` text NOT NULL,
	`subject` text NOT NULL,
	`owner` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_identity_subject` ON `auth_identities` (`issuer`,`subject`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_identity_owner` ON `auth_identities` (`issuer`,`owner`);