/*
Tujuan: Mendefinisikan schema tabel answers untuk jawaban peserta ujian fase 4.
Caller: Drizzle Kit, exam repository, answer queue, dan grading worker.
Dependensi: drizzle-orm/pg-core dan schema exam_sessions/questions/options.
Main Functions: Menyimpan jawaban terakhir per sesi-soal dengan unique key dan lookup cepat untuk grading.
Side Effects: Menjadi sumber migration database untuk jawaban ujian.
*/

import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { examSessions } from './exam-sessions.schema'
import { options } from './options.schema'
import { questions } from './questions.schema'

export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => examSessions.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  selectedOptionId: uuid('selected_option_id').references(() => options.id, { onDelete: 'set null' }),
  answerText: text('answer_text'),
  isMarkedDoubt: boolean('is_marked_doubt').notNull().default(false),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  sessionQuestionUnique: uniqueIndex('uidx_answers_session_question').on(table.sessionId, table.questionId),
  sessionIndex: index('idx_answers_session').on(table.sessionId),
  questionIndex: index('idx_answers_question').on(table.questionId)
}))

