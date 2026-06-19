/*
Tujuan: Mendefinisikan schema tabel material_progresses untuk progres belajar murid fase 3.
Caller: Drizzle Kit, material repository, dan use case track progress.
Dependensi: drizzle-orm/pg-core dan schema materials/users.
Main Functions: Menyimpan progres per user-material dengan unique key dan indeks lookup cepat.
Side Effects: Menjadi sumber migration database untuk progres belajar.
*/

import { boolean, index, integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { materials } from './materials.schema'
import { users } from './users.schema'

export const materialProgresses = pgTable('material_progresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  progressPercent: integer('progress_percent').notNull().default(0),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  lastAccessedAt: timestamp('last_accessed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userMaterialUnique: uniqueIndex('uidx_material_progress_user_material').on(table.userId, table.materialId),
  userCompletedIndex: index('idx_material_progress_user_completed').on(table.userId, table.isCompleted),
  materialIndex: index('idx_material_progress_material').on(table.materialId)
}))
