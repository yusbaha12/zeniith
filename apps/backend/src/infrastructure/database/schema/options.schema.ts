/*
Tujuan: Mendefinisikan schema tabel options untuk pilihan jawaban soal fase 4.
Caller: Drizzle Kit, exam repository, teacher CRUD soal, dan grading worker.
Dependensi: drizzle-orm/pg-core dan schema questions.
Main Functions: Menyimpan opsi A/B/C/D/E, jawaban benar, dan urutan tampil per soal.
Side Effects: Menjadi sumber migration database untuk opsi jawaban.
*/

import { boolean, index, integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { questions } from './questions.schema'

export const options = pgTable('options', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  optionKey: varchar('option_key', { length: 2 }).notNull(),
  contentJson: jsonb('content_json').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  questionSortIndex: index('idx_options_question_sort').on(table.questionId, table.sortOrder),
  questionCorrectIndex: index('idx_options_question_correct').on(table.questionId, table.isCorrect)
}))

