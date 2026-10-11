// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{id:text('id').primaryKey(),name:text('name').notNull(),school:text('school').notNull(),bio:text('bio').notNull().default(''),created:integer('created').notNull()});
export const posts=sqliteTable('posts',{id:text('id').primaryKey(),author:text('author').notNull(),title:text('title').notNull(),body:text('body').notNull(),category:text('category').notNull(),created:integer('created').notNull(),resolved:integer('resolved').notNull().default(0)});
export const comments=sqliteTable('comments',{id:text('id').primaryKey(),post:text('post').notNull(),author:text('author').notNull(),body:text('body').notNull(),created:integer('created').notNull()});
export const likes=sqliteTable('likes',{post:text('post').notNull(),user:text('user').notNull()},t=>[primaryKey({columns:[t.post,t.user]})]);
