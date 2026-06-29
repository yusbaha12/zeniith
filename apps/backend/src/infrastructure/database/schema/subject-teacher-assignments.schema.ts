/*
Tujuan: Mendefinisikan pivot PIC guru per mata pelajaran kurikulum.
Caller: Drizzle Kit, module repository, dan superadmin curriculum controller.
Dependensi: drizzle-orm/pg-core, schema subjects, dan schema users.
Main Functions: Menyimpan assignment guru ke subject dengan unique key agar PIC bisa satu atau lebih guru.
Side Effects: Menjadi sumber migration database untuk kontrol akses guru pada kurikulum.
*/

import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'

import { subjects } from './subjects.schema'
import { users } from './users.schema'

export const subjectTeacherAssignments = pgTable('subject_teacher_assignments', {
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.subjectId, table.teacherId] }),
  teacherIndex: index('idx_subject_teacher_assignments_teacher').on(table.teacherId),
  subjectIndex: index('idx_subject_teacher_assignments_subject').on(table.subjectId)
}))
