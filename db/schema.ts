// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{id:text('id').primaryKey(),name:text('name').notNull(),school:text('school').notNull(),bio:text('bio').notNull().default(''),created:integer('created').notNull()});
export const posts=sqliteTable('posts',{id:text('id').primaryKey(),author:text('author').notNull(),title:text('title').notNull(),body:text('body').notNull(),category:text('category').notNull(),created:integer('created').notNull(),resolved:integer('resolved').notNull().default(0)});
export const comments=sqliteTable('comments',{id:text('id').primaryKey(),post:text('post').notNull(),author:text('author').notNull(),body:text('body').notNull(),created:integer('created').notNull()});
export const likes=sqliteTable('likes',{post:text('post').notNull(),user:text('user').notNull()},t=>[primaryKey({columns:[t.post,t.user]})]);
export const rooms=sqliteTable('rooms',{id:text('id').primaryKey(),kind:text('kind').notNull(),name:text('name').notNull(),description:text('description').notNull().default(''),category:text('category').notNull().default(''),school:text('school').notNull().default(''),owner:text('owner').notNull(),pair:text('pair').unique(),created:integer('created').notNull()});
export const roomMembers=sqliteTable('room_members',{room:text('room').notNull(),user:text('user').notNull(),joined:integer('joined').notNull(),readSeq:integer('read_seq').notNull().default(0)},t=>[primaryKey({columns:[t.room,t.user]}),index('members_user').on(t.user)]);
export const messages=sqliteTable('messages',{seq:integer('seq').primaryKey({autoIncrement:true}),room:text('room').notNull(),sender:text('sender').notNull(),body:text('body').notNull(),created:integer('created').notNull()},t=>[index('messages_room_seq').on(t.room,t.seq),index('messages_sender_created').on(t.sender,t.created)]);
