CREATE INDEX `messages_room_seq` ON `messages` (`room`,`seq`);--> statement-breakpoint
CREATE INDEX `messages_sender_created` ON `messages` (`sender`,`created`);--> statement-breakpoint
CREATE INDEX `members_user` ON `room_members` (`user`);