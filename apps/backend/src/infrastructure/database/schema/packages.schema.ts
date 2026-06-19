/*
Tujuan: Mendefinisikan schema tabel packages untuk katalog paket belajar fase 2.
Caller: Drizzle Kit, package repository, dan seed paket.
Dependensi: drizzle-orm/pg-core.
Main Functions: Menyediakan enum package type, metadata paket, dan indeks baca katalog.
Side Effects: Menjadi sumber migration database untuk modul paket.
*/

import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const packageTypeEnum = pgEnum('package_type', [
  'REGULER',
  'INTENSIF',
  'PREMIUM'
])

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description').notNull(),
  type: packageTypeEnum('type').notNull(),
  price: integer('price').notNull(),
  durationDays: integer('duration_days').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  activeSortIndex: index('idx_packages_active_sort').on(table.isActive, table.sortOrder),
  typeIndex: index('idx_packages_type').on(table.type)
}))
