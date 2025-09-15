import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import {
  CityOptions,
  PropertyTypeOptions,
  BHKOptions,
  PurposeOptions,
  TimelineOptions,
  SourceOptions,
  StatusOptions,
} from '../constants';

export const cityEnum = pgEnum('city', CityOptions);
export const propertyTypeEnum = pgEnum('property_type', PropertyTypeOptions);
export const bhkEnum = pgEnum('bhk', BHKOptions);
export const purposeEnum = pgEnum('purpose', PurposeOptions);
export const timelineEnum = pgEnum('timeline', TimelineOptions);
export const sourceEnum = pgEnum('source', SourceOptions);
export const statusEnum = pgEnum('status', StatusOptions);
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);

export const users = pgTable('users', {
  id: text('id').primaryKey(), // This will be the Supabase auth user ID
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  role: userRoleEnum('role').notNull(),
});

export const buyers = pgTable('buyers', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 80 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 15 }).notNull(),
  city: cityEnum('city').notNull(),
  propertyType: propertyTypeEnum('property_type').notNull(),
  bhk: bhkEnum('bhk'),
  purpose: purposeEnum('purpose').notNull(),
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  timeline: timelineEnum('timeline').notNull(),
  source: sourceEnum('source').notNull(),
  status: statusEnum('status').notNull().default('New'),
  notes: text('notes'),
  tags: jsonb('tags').$type<{ value: string }[]>().default([]),
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const buyerHistory = pgTable('buyer_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerId: uuid('buyer_id').references(() => buyers.id, { onDelete: 'cascade' }).notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
  changedBy: jsonb('changed_by').$type<{ id: string; name: string; role: 'USER' | 'ADMIN' }>().notNull(),
  diff: jsonb('diff').$type<Record<string, [any, any]>>().notNull(),
});