/*
Tujuan: Mendefinisikan override permission per user untuk kasus ALLOW dan DENY granular.
Caller: Drizzle Kit generate/migrate, seed override khusus bila diperlukan, dan service authz runtime.
Dependensi: drizzle-orm/pg-core, users schema, permissions schema.
Main Functions: Menyediakan enum permission_effect dan tabel user_permissions dengan unique override per user-permission.
Side Effects: Menjadi sumber kebenaran migration override permission user dan indeks evaluasi authz efektif.
*/

import { index, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { permissions } from './permissions.schema'
import { users } from './users.schema'

export const permissionEffectEnum = pgEnum('permission_effect', ['ALLOW', 'DENY'])

export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  effect: permissionEffectEnum('effect').notNull().default('ALLOW'),
  reason: text('reason'),
  expiresAt: timestamp('expires_at'),
  grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIndex: index('idx_user_permissions_user').on(table.userId),
  userEffectiveIndex: index('idx_user_permissions_effective').on(table.userId, table.effect, table.expiresAt),
  permissionIndex: index('idx_user_permissions_permission').on(table.permissionId),
  userPermissionUnique: unique('uidx_user_permissions_user_permission').on(table.userId, table.permissionId)
}))
