/*
Tujuan: Mendefinisikan schema tabel proctor_logs untuk log kecurangan ujian fase 6.
Caller: Drizzle Kit, proctor repository, use case, dan websocket handler.
Dependensi: drizzle-orm/pg-core dan schema exam_sessions/users.
Main Functions: Menyimpan data log kecurangan ujian per sesi.
Side Effects: Menjadi sumber migration database untuk log proctoring.
*/

import { index, pgEnum, pgTable, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'

import { examSessions } from './exam-sessions.schema'
import { users } from './users.schema'

export const proctorEventTypeEnum = pgEnum('proctor_event_type', [
  'TAB_SWITCH',
  'WINDOW_BLUR',
  'RIGHT_CLICK',
  'KEYBOARD_SHORTCUT',
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT'
])

export const proctorLogs = pgTable('proctor_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => examSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: proctorEventTypeEnum('event_type').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  occurredAt: timestamp('occurred_at').defaultNow().notNull()
}, (table) => ({
  sessionOccurredIndex: index('idx_proctor_logs_session_occurred').on(table.sessionId, table.occurredAt),
  userIndex: index('idx_proctor_logs_user').on(table.userId)
}))
