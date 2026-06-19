/*
Tujuan: Mendefinisikan baseline permission tiap role untuk RBAC granular.
Caller: Drizzle Kit generate/migrate, seed baseline role permission, dan service authz.
Dependensi: drizzle-orm/pg-core, userRoleEnum, permissions schema.
Main Functions: Menyediakan tabel role_permissions dengan PK komposit role-permission dan indeks lookup permission.
Side Effects: Menjadi sumber kebenaran migration mapping role ke permission registry.
*/

import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'

import { permissions } from './permissions.schema'
import { userRoleEnum } from './users.schema'

export const rolePermissions = pgTable('role_permissions', {
  role: userRoleEnum('role').notNull(),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.role, table.permissionId] }),
  permissionIndex: index('idx_role_permissions_permission').on(table.permissionId)
}))
