/*
Tujuan: Mendefinisikan schema tabel modules untuk pengelompokan materi per mata pelajaran fase 3.
Caller: Drizzle Kit, module repository, dan seed ruang belajar.
Dependensi: drizzle-orm/pg-core dan schema subjects.
Main Functions: Menyimpan metadata modul per subject dan indeks baca terurut.
Side Effects: Menjadi sumber migration database untuk modul ruang belajar.
*/

import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { subjects } from './subjects.schema'

export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 160 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  subjectSortIndex: index('idx_modules_subject_sort').on(table.subjectId, table.isActive, table.sortOrder)
}))
