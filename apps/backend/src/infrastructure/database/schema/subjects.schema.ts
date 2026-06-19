/*
Tujuan: Mendefinisikan schema tabel subjects untuk katalog mata pelajaran fase 3.
Caller: Drizzle Kit, module repository, dan seed ruang belajar.
Dependensi: drizzle-orm/pg-core.
Main Functions: Menyimpan metadata mapel dan indeks baca daftar subject aktif.
Side Effects: Menjadi sumber migration database untuk modul ruang belajar.
*/

import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  activeSortIndex: index('idx_subjects_active_sort').on(table.isActive, table.sortOrder)
}))
