/*
Tujuan: Mendefinisikan schema tabel exam_sessions untuk sesi ujian murid fase 4.
Caller: Drizzle Kit, exam repository, queue auto-submit, dan use case start/submit exam.
Dependensi: drizzle-orm/pg-core dan schema exams/users.
Main Functions: Menyimpan rentang sesi aktif, status submit, deadline, dan warning count per peserta.
Side Effects: Menjadi sumber migration database untuk sesi ujian.
*/

import { index, integer, pgTable, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'

import { exams, sessionStatusEnum } from './exams.schema'
import { users } from './users.schema'

export const examSessions = pgTable('exam_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: sessionStatusEnum('status').notNull().default('ACTIVE'),
  warningCount: integer('warning_count').notNull().default(0),
  isAutoSubmitted: boolean('is_auto_submitted').notNull().default(false),
  startedAt: timestamp('started_at').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  submittedAt: timestamp('submitted_at'),
  lastHeartbeatAt: timestamp('last_heartbeat_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userStatusIndex: index('idx_exam_sessions_user_status').on(table.userId, table.status),
  examStatusIndex: index('idx_exam_sessions_exam_status').on(table.examId, table.status),
  expiresAtIndex: index('idx_exam_sessions_expires_at').on(table.status, table.expiresAt)
}))

