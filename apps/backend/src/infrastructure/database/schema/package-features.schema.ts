/*
Tujuan: Mendefinisikan schema tabel package_features untuk fitur rincian tiap paket fase 2.
Caller: Drizzle Kit, package repository, dan seed paket.
Dependensi: drizzle-orm/pg-core dan schema packages.
Main Functions: Menyimpan fitur terurut per paket untuk detail katalog publik.
Side Effects: Menjadi sumber migration database untuk fitur paket.
*/

import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { packages } from './packages.schema'

export const packageFeatures = pgTable('package_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull().references(() => packages.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 160 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  packageSortIndex: index('idx_package_features_package_sort').on(table.packageId, table.sortOrder)
}))
