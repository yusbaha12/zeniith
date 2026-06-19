/*
Tujuan: Mendefinisikan schema tabel exam_results untuk hasil akhir grading ujian fase 4.
Caller: Drizzle Kit, exam repository, grading worker, dan halaman hasil ujian murid.
Dependensi: drizzle-orm/pg-core dan schema exam_sessions/exams/users.
Main Functions: Menyimpan agregat skor, akurasi, durasi, dan timestamp grading per sesi.
Side Effects: Menjadi sumber migration database untuk hasil ujian.
*/

import { index, integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { exams } from './exams.schema'
import { examSessions } from './exam-sessions.schema'
import { users } from './users.schema'

export const examResults = pgTable('exam_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => examSessions.id, { onDelete: 'cascade' }),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalQuestions: integer('total_questions').notNull(),
  answeredQuestions: integer('answered_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  wrongAnswers: integer('wrong_answers').notNull(),
  unansweredQuestions: integer('unanswered_questions').notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  percentage: integer('percentage').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  submittedAt: timestamp('submitted_at').notNull(),
  gradedAt: timestamp('graded_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  sessionUnique: uniqueIndex('uidx_exam_results_session').on(table.sessionId),
  examScoreIndex: index('idx_exam_results_exam_score').on(table.examId, table.score),
  userGradedIndex: index('idx_exam_results_user_graded').on(table.userId, table.gradedAt)
}))
