CREATE TABLE `exchange_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`retry_after` integer DEFAULT 0 NOT NULL
);
