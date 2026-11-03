-- Additive, durable personal IDs; never replace internal financial owner keys.
CREATE TABLE `platform_profile_ids` (
 `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
 `owner` text NOT NULL,
 `created` text NOT NULL,
 FOREIGN KEY (`owner`) REFERENCES `platform_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profile_owner_unique` ON `platform_profile_ids` (`owner`);
--> statement-breakpoint
INSERT INTO sqlite_sequence(name,seq)
SELECT 'platform_profile_ids',7049
WHERE NOT EXISTS(SELECT 1 FROM sqlite_sequence WHERE name='platform_profile_ids');
--> statement-breakpoint
INSERT OR IGNORE INTO platform_profile_ids(owner,created)
SELECT id,created FROM platform_users ORDER BY created,id;
