/*
Tujuan: Mendefinisikan registry permission granular untuk fondasi RBAC fase 7.
Caller: Drizzle Kit generate/migrate, seed RBAC, dan repository authz berikutnya.
Dependensi: drizzle-orm/pg-core.
Main Functions: Menyediakan tabel permissions dengan code stabil, modul, aksi, dan indeks lookup utama.
Side Effects: Menjadi sumber kebenaran migration untuk tabel registry permission.
*/

import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  module: varchar('module', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  description: text('description').notNull(),
  isSystem: boolean('is_system').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  moduleIndex: index('idx_permissions_module').on(table.module),
  moduleActionIndex: index('idx_permissions_module_action').on(table.module, table.action)
}))
