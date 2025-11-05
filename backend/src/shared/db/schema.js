import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  jsonb,
  decimal,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ===================================================================
// Users Table
// ===================================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cognito_id: varchar('cognito_id', { length: 255 }).unique().notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    preferences: jsonb('preferences').default({}).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    roleCheck: check('role_check', sql`${table.role} IN ('admin', 'field_worker')`),
  }),
);

// ===================================================================
// Quotes Table
// ===================================================================
export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  quote_number: varchar('quote_number', { length: 50 }).unique().notNull(),
  version: integer('version').default(1).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  customer_name: varchar('customer_name', { length: 255 }).notNull(),
  customer_email: varchar('customer_email', { length: 255 }),
  customer_phone: varchar('customer_phone', { length: 50 }),
  customer_address: text('customer_address'),
  location: jsonb('location'),
  metadata: jsonb('metadata').default({}).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ===================================================================
// Jobs Table
// ===================================================================
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  quote_id: uuid('quote_id')
    .references(() => quotes.id, { onDelete: 'cascade' })
    .notNull(),
  job_type: varchar('job_type', { length: 50 }).notNull(),
  order_index: integer('order_index').notNull(),
  parameters: jsonb('parameters').notNull(),
  materials: jsonb('materials').array().notNull(),
  labour: jsonb('labour').notNull(),
  calculations: jsonb('calculations').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
});

// ===================================================================
// Financials Table (one-to-one with quotes)
// ===================================================================
export const financials = pgTable('financials', {
  quote_id: uuid('quote_id')
    .references(() => quotes.id, { onDelete: 'cascade' })
    .primaryKey(),
  direct_cost: decimal('direct_cost', { precision: 10, scale: 2 }).notNull(),
  overhead_multiplier: decimal('overhead_multiplier', { precision: 5, scale: 2 }).notNull(),
  profit_first: jsonb('profit_first').notNull(),
  gst_rate: decimal('gst_rate', { precision: 5, scale: 4 }).notNull(),
  gst_amount: decimal('gst_amount', { precision: 10, scale: 2 }).notNull(),
  total_inc_gst: decimal('total_inc_gst', { precision: 10, scale: 2 }).notNull(),
  rounded_total: decimal('rounded_total', { precision: 10, scale: 2 }).notNull(),
  deposit: jsonb('deposit').notNull(),
});

// ===================================================================
// Price Sheets Table
// ===================================================================
export const priceSheets = pgTable('price_sheets', {
  id: uuid('id').defaultRandom().primaryKey(),
  version: integer('version').notNull(),
  created_by: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  defaults: jsonb('defaults').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ===================================================================
// Price Items Table
// ===================================================================
export const priceItems = pgTable('price_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  price_sheet_id: uuid('price_sheet_id')
    .references(() => priceSheets.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  last_checked: timestamp('last_checked'),
  notes: text('notes'),
});

// ===================================================================
// Quote Versions Table
// ===================================================================
export const quoteVersions = pgTable('quote_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quote_id: uuid('quote_id')
    .references(() => quotes.id)
    .notNull(),
  version: integer('version').notNull(),
  data: jsonb('data').notNull(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  device_id: varchar('device_id', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ===================================================================
// Sync Logs Table
// ===================================================================
export const syncLogs = pgTable('sync_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  device_id: varchar('device_id', { length: 255 }).notNull(),
  quote_id: uuid('quote_id'),
  operation: varchar('operation', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ===================================================================
// Relations
// ===================================================================
export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
  priceSheets: many(priceSheets),
  quoteVersions: many(quoteVersions),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  user: one(users, {
    fields: [quotes.user_id],
    references: [users.id],
  }),
  jobs: many(jobs),
  financials: one(financials, {
    fields: [quotes.id],
    references: [financials.quote_id],
  }),
  versions: many(quoteVersions),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  quote: one(quotes, {
    fields: [jobs.quote_id],
    references: [quotes.id],
  }),
}));

export const financialsRelations = relations(financials, ({ one }) => ({
  quote: one(quotes, {
    fields: [financials.quote_id],
    references: [quotes.id],
  }),
}));

export const priceSheetsRelations = relations(priceSheets, ({ one, many }) => ({
  creator: one(users, {
    fields: [priceSheets.created_by],
    references: [users.id],
  }),
  items: many(priceItems),
}));

export const priceItemsRelations = relations(priceItems, ({ one }) => ({
  priceSheet: one(priceSheets, {
    fields: [priceItems.price_sheet_id],
    references: [priceSheets.id],
  }),
}));

export const quoteVersionsRelations = relations(quoteVersions, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteVersions.quote_id],
    references: [quotes.id],
  }),
  user: one(users, {
    fields: [quoteVersions.user_id],
    references: [users.id],
  }),
}));
