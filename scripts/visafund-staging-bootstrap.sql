CREATE TABLE IF NOT EXISTS `accounts` (
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

CREATE INDEX IF NOT EXISTS `accounts_owner` ON `accounts` (`owner`);
CREATE TABLE IF NOT EXISTS `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`entity` text NOT NULL,
	`action` text NOT NULL,
	`before` text,
	`after` text,
	`created` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `audit_owner` ON `audit` (`owner`,`created`);
CREATE TABLE IF NOT EXISTS `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`details` text NOT NULL,
	`created` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `documents_owner` ON `documents` (`owner`);
CREATE TABLE IF NOT EXISTS `records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `records_owner_kind` ON `records` (`owner`,`kind`);
CREATE TABLE IF NOT EXISTS `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`country` text NOT NULL,
	`data` text NOT NULL,
	`version` integer NOT NULL,
	`updated_by` text NOT NULL,
	`created` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `rules_country` ON `rules` (`country`);
CREATE TABLE IF NOT EXISTS `transactions` (
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

CREATE INDEX IF NOT EXISTS `tx_owner_date` ON `transactions` (`owner`,`date`);
CREATE INDEX IF NOT EXISTS `tx_account_date` ON `transactions` (`account`,`date`);
CREATE UNIQUE INDEX IF NOT EXISTS `tx_duplicate` ON `transactions` (`owner`,`fingerprint`);

CREATE TABLE IF NOT EXISTS `limits` (
	`id` text PRIMARY KEY NOT NULL,
	`stamp` integer NOT NULL,
	`count` integer NOT NULL
);


CREATE TABLE IF NOT EXISTS `platform_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`target` text,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`created` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `platform_audit_created` ON `platform_audit` (`created`);
CREATE TABLE IF NOT EXISTS `platform_content` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `platform_content_kind_status` ON `platform_content` (`kind`,`status`);
CREATE TABLE IF NOT EXISTS `platform_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created` text NOT NULL,
	`last_seen` text NOT NULL,
	`terms_version` text,
	`preferences` text DEFAULT '{}' NOT NULL
);

CREATE INDEX IF NOT EXISTS `platform_users_status_created` ON `platform_users` (`status`,`created`);

CREATE TABLE IF NOT EXISTS `platform_deletion_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`target` text NOT NULL,
	`status` text NOT NULL,
	`eligible_after` text NOT NULL,
	`created` text NOT NULL,
	`policy_version` text NOT NULL,
	`requested_by` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `platform_deletion_jobs_status` ON `platform_deletion_jobs` (`status`,`eligible_after`);

CREATE TABLE IF NOT EXISTS `auth_flows` (
	`hash` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`session` text NOT NULL,
	`purpose` text NOT NULL,
	`expires` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `auth_flows_expiry` ON `auth_flows` (`expires`);
CREATE TABLE IF NOT EXISTS `auth_identities` (
	`issuer` text NOT NULL,
	`subject` text NOT NULL,
	`owner` text NOT NULL,
	`created` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `auth_identity_subject` ON `auth_identities` (`issuer`,`subject`);
CREATE UNIQUE INDEX IF NOT EXISTS `auth_identity_owner` ON `auth_identities` (`issuer`,`owner`);

CREATE TABLE IF NOT EXISTS `exchange_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`retry_after` integer DEFAULT 0 NOT NULL
);


CREATE TABLE IF NOT EXISTS `platform_roles` (
	`owner` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL CHECK (`role` IN ('USER','SUPER_ADMIN')),
	`provisioned_by` text DEFAULT 'registration' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `platform_users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `auth_revoked_sessions` (
	`issuer` text NOT NULL,
	`session` text NOT NULL,
	`subject` text NOT NULL,
	`created` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `revoked_session_key` ON `auth_revoked_sessions` (`issuer`,`session`);

INSERT OR IGNORE INTO platform_roles(owner,role,provisioned_by,created) SELECT id,'USER','migration',created FROM platform_users;


SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' ORDER BY name;
