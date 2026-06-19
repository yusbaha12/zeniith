/*
Tujuan: Mendefinisikan schema tabel questions untuk butir soal ujian fase 4.
Caller: Drizzle Kit, exam repository, teacher CRUD soal, dan grading worker.
Dependensi: drizzle-orm/pg-core dan schema exams.
Main Functions: Menyimpan konten soal, pembahasan, skor, dan urutan per exam.
Side Effects: Menjadi sumber migration database untuk butir soal ujian.
*/

import { index, integer, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

import { exams, questionTypeEnum } from './exams.schema'

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  questionType: questionTypeEnum('question_type').notNull(),
  contentJson: jsonb('content_json').notNull(),
  explanationJson: jsonb('explanation_json'),
  score: integer('score').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  examSortIndex: index('idx_questions_exam_sort').on(table.examId, table.sortOrder),
  examScoreIndex: index('idx_questions_exam_score').on(table.examId, table.score)
}))

