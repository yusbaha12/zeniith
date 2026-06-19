/*
Tujuan: Mendefinisikan schema tabel package_subjects untuk relasi Many-to-Many paket dengan mata pelajaran.
Caller: Drizzle Kit, package repository, dan seeds.
Dependensi: pg-core, schema packages, dan schema subjects.
Main Functions: Menyediakan tabel relasi package_subjects dengan foreign keys cascade.
Side Effects: Menjadi sumber migration database.
*/

import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'

import { packages } from './packages.schema'
import { subjects } from './subjects.schema'

export const packageSubjects = pgTable('package_subjects', {
  packageId: uuid('package_id').notNull().references(() => packages.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.packageId, table.subjectId] })
}))
