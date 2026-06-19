/*
Tujuan: Mendefinisikan schema tabel proctor_warnings untuk riwayat peringatan proctoring fase 6.
Caller: Drizzle Kit, proctor repository, dan use case.
Dependensi: drizzle-orm/pg-core dan schema exam_sessions/users.
Main Functions: Menyimpan data peringatan yang diberikan ke murid per sesi ujian.
Side Effects: Menjadi sumber migration database untuk peringatan proctoring.
*/

import { index, pgTable, timestamp, uuid, text, integer } from 'drizzle-orm/pg-core'

import { examSessions } from './exam-sessions.schema'
import { users } from './users.schema'

export const proctorWarnings = pgTable('proctor_warnings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => examSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  warningCount: integer('warning_count').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  sessionCreatedIndex: index('idx_proctor_warnings_session_created').on(table.sessionId, table.createdAt),
  userIndex: index('idx_proctor_warnings_user').on(table.userId)
}))
