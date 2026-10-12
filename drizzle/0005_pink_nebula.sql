ALTER TABLE `posts` ADD `school` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `posts_school_created` ON `posts` (`school`,`created`);