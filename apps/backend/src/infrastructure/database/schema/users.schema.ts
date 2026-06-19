/*
Tujuan: Menyediakan schema awal tabel users sebagai anchor Drizzle fase 0.
Caller: Drizzle Kit generate/migrate dan repository user pada fase berikutnya.
Dependensi: drizzle-orm/pg-core.
Main Functions: Mendefinisikan enum role dan tabel users minimal sesuai dokumentasi proyek.
Side Effects: Menjadi sumber kebenaran migration saat tooling database dijalankan.
*/

import { boolean, index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { branches } from './branches.schema'

export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN',
  'BRANCH_ADMIN',
  'TEACHER',
  'STUDENT'
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phone: varchar('phone', { length: 15 }),
  role: userRoleEnum('role').notNull().default('STUDENT'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  emailIndex: index('idx_users_email').on(table.email),
  branchIndex: index('idx_users_branch').on(table.branchId),
  roleIndex: index('idx_users_role').on(table.role)
}))
