CREATE TABLE `participants` (
	`post` text NOT NULL,
	`user` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`post`, `user`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `price` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `condition` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `place` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `event_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `capacity` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `task_kind` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `circle` text DEFAULT '' NOT NULL;