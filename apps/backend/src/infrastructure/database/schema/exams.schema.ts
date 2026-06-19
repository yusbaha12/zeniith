/*
Tujuan: Mendefinisikan schema tabel exams untuk try out dan ujian fase 4.
Caller: Drizzle Kit, exam repository, dan teacher/student exam controller.
Dependensi: drizzle-orm/pg-core, enum exam/session shared, dan schema branches/users/subjects.
Main Functions: Menyimpan metadata ujian, jadwal, durasi, dan indeks list ujian teacher maupun murid.
Side Effects: Menjadi sumber migration database untuk modul mesin ujian.
*/

import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { branches } from './branches.schema'
import { subjects } from './subjects.schema'
import { users } from './users.schema'

export const examTypeEnum = pgEnum('exam_type', [
  'TRYOUT',
  'LATIHAN',
  'MID_EXAM',
  'FINAL_EXAM'
])

export const sessionStatusEnum = pgEnum('session_status', [
  'ACTIVE',
  'SUBMITTED',
  'EXPIRED',
  'TERMINATED'
])

export const questionTypeEnum = pgEnum('question_type', [
  'MULTIPLE_CHOICE',
  'ESSAY'
])

export const exams = pgTable('exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 180 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull().unique(),
  description: text('description'),
  instructions: text('instructions'),
  examType: examTypeEnum('exam_type').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  totalQuestions: integer('total_questions').notNull().default(0),
  totalScore: integer('total_score').notNull().default(0),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  branchPublishedStartsIndex: index('idx_exams_branch_published_starts').on(table.branchId, table.isPublished, table.startsAt),
  teacherUpdatedIndex: index('idx_exams_teacher_updated').on(table.createdBy, table.updatedAt),
  subjectStartsIndex: index('idx_exams_subject_starts').on(table.subjectId, table.startsAt)
}))

