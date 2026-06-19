/*
Tujuan: Mendefinisikan schema tabel materials untuk video, PDF, teks, dan latihan fase 3.
Caller: Drizzle Kit, material repository, dan teacher CRUD materi.
Dependensi: drizzle-orm/pg-core, enum material type shared, dan schema modules/users/branches.
Main Functions: Menyimpan metadata materi, content JSONB, attachment object key, dan indeks list/detail hemat biaya.
Side Effects: Menjadi sumber migration database untuk modul ruang belajar.
*/

import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { branches } from './branches.schema'
import { modules } from './modules.schema'
import { users } from './users.schema'

export const materialTypeEnum = pgEnum('material_type', [
  'VIDEO',
  'PDF',
  'EXERCISE',
  'TEXT'
])

export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 180 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull(),
  summary: text('summary'),
  materialType: materialTypeEnum('material_type').notNull(),
  contentJson: jsonb('content_json'),
  attachmentObjectKey: text('attachment_object_key'),
  attachmentFileName: varchar('attachment_file_name', { length: 255 }),
  attachmentContentType: varchar('attachment_content_type', { length: 120 }),
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  modulePublishedSortIndex: index('idx_materials_module_published_sort').on(table.moduleId, table.isPublished, table.sortOrder),
  teacherUpdatedIndex: index('idx_materials_teacher_updated').on(table.createdBy, table.updatedAt),
  branchPublishedIndex: index('idx_materials_branch_published').on(table.branchId, table.isPublished)
}))
