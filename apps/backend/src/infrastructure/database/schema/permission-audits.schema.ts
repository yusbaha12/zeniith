/*
Tujuan: Menyimpan audit trail perubahan permission dan role yang sensitif.
Caller: Drizzle Kit generate/migrate dan service audit authz fase 7-8.
Dependensi: drizzle-orm/pg-core, users schema, userRoleEnum, permissionEffectEnum.
Main Functions: Menyediakan tabel permission_audits untuk snapshot aksi grant/revoke/allow/deny.
Side Effects: Menjadi sumber kebenaran migration histori perubahan permission tanpa mengganggu tabel aktif.
*/

import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { permissionEffectEnum } from './user-permissions.schema'
import { userRoleEnum, users } from './users.schema'

export const permissionAudits = pgTable('permission_audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  targetRole: userRoleEnum('target_role'),
  permissionCode: varchar('permission_code', { length: 100 }).notNull(),
  effect: permissionEffectEnum('effect'),
  actionType: varchar('action_type', { length: 30 }).notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  actorCreatedIndex: index('idx_permission_audits_actor_created').on(table.actorUserId, table.createdAt),
  targetCreatedIndex: index('idx_permission_audits_target_created').on(table.targetUserId, table.createdAt),
  codeCreatedIndex: index('idx_permission_audits_code_created').on(table.permissionCode, table.createdAt)
}))
