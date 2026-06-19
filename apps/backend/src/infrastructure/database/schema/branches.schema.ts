/*
Tujuan: Menyediakan schema tabel branches fase 1 untuk pendaftaran dan isolasi data per cabang.
Caller: Drizzle Kit generate/migrate dan repository branch.
Dependensi: drizzle-orm/pg-core.
Main Functions: Mendefinisikan kolom cabang aktif yang dipakai register, profile, dan branch scope.
Side Effects: Menjadi sumber kebenaran migration tabel branches.
*/

import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  codeIndex: index('idx_branches_code').on(table.code)
}))
