CREATE TABLE `circle_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `circle_replies_room` ON `circle_replies` (`room`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`post` text,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `photos_post` ON `photos` (`post`);--> statement-breakpoint
ALTER TABLE `posts` ADD `anonymous` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `reward` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `difficulty` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `content_kind` text DEFAULT '动态' NOT NULL;