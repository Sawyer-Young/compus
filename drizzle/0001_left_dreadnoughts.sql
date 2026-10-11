CREATE TABLE `messages` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`sender` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_members` (
	`room` text NOT NULL,
	`user` text NOT NULL,
	`joined` integer NOT NULL,
	`read_seq` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`room`, `user`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`school` text DEFAULT '' NOT NULL,
	`owner` text NOT NULL,
	`pair` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_pair_unique` ON `rooms` (`pair`);