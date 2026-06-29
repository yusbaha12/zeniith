/*
Tujuan: Menyediakan implementasi repository subject/module/PIC guru berbasis Drizzle untuk ruang belajar fase 3/7.
Caller: Use case daftar subject/module, teacher form materi, dan superadmin curriculum management.
Dependensi: AppDatabase, schema subjects/modules/subjectTeacherAssignments/users, dan ModuleMapper.
Main Functions: Menjalankan query subject aktif, module terurut, assignment PIC guru, dan cek akses guru dengan indeks baca minimum cost.
Side Effects: Membaca dan menulis tabel subjects, modules, dan subject_teacher_assignments pada PostgreSQL.
*/

import { and, asc, eq, inArray, sql } from 'drizzle-orm'

import type { IModuleRepository, SubjectListItem } from '../../domain/repositories/module.repository'
import type { ModuleEntity } from '../../domain/entities/module.entity'
import type { AppDatabase } from '../database/connection'
import { modules, subjectTeacherAssignments, subjects, users } from '../database/schema'
import { ModuleMapper } from '../mappers/module.mapper'

export class ModuleRepositoryImpl implements IModuleRepository {
  constructor(private readonly database: AppDatabase) {}

  async listActiveSubjects(): Promise<SubjectListItem[]> {
    const rows = await this.database
      .select({
        id: subjects.id,
        name: subjects.name,
        slug: subjects.slug,
        description: subjects.description,
        sortOrder: subjects.sortOrder,
        isActive: subjects.isActive
      })
      .from(subjects)
      .where(eq(subjects.isActive, true))
      .orderBy(asc(subjects.sortOrder), asc(subjects.createdAt))

    return this.attachTeacherIds(rows)
  }

  async listActiveSubjectsForTeacher(teacherId: string): Promise<SubjectListItem[]> {
    const rows = await this.database
      .select({
        id: subjects.id,
        name: subjects.name,
        slug: subjects.slug,
        description: subjects.description,
        sortOrder: subjects.sortOrder,
        isActive: subjects.isActive
      })
      .from(subjects)
      .where(and(
        eq(subjects.isActive, true),
        sql<boolean>`(
          not exists (
            select 1 from ${subjectTeacherAssignments}
            where ${subjectTeacherAssignments.subjectId} = ${subjects.id}
          )
          or exists (
            select 1 from ${subjectTeacherAssignments}
            where ${subjectTeacherAssignments.subjectId} = ${subjects.id}
              and ${subjectTeacherAssignments.teacherId} = ${teacherId}
          )
        )`
      ))
      .orderBy(asc(subjects.sortOrder), asc(subjects.createdAt))

    return this.attachTeacherIds(rows)
  }

  async listModulesBySubjectId(subjectId: string): Promise<ModuleEntity[]> {
    const rows = await this.database
      .select()
      .from(modules)
      .where(eq(modules.subjectId, subjectId))
      .orderBy(asc(modules.sortOrder), asc(modules.createdAt))

    return rows.map(ModuleMapper.toDomain)
  }

  async findModuleById(moduleId: string): Promise<ModuleEntity | null> {
    const [row] = await this.database
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1)

    return row ? ModuleMapper.toDomain(row) : null
  }

  async listAllSubjects(): Promise<SubjectListItem[]> {
    const rows = await this.database
      .select({
        id: subjects.id,
        name: subjects.name,
        slug: subjects.slug,
        description: subjects.description,
        sortOrder: subjects.sortOrder,
        isActive: subjects.isActive
      })
      .from(subjects)
      .orderBy(asc(subjects.sortOrder), asc(subjects.createdAt))

    return this.attachTeacherIds(rows)
  }

  async createSubject(input: {
    name: string
    description?: string | null
    sortOrder?: number
    isActive?: boolean
    teacherIds?: string[]
  }): Promise<SubjectListItem> {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const row = await this.database.transaction(async (transaction) => {
      const [created] = await transaction
        .insert(subjects)
        .values({
          name: input.name,
          slug,
          description: input.description ?? null,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true
        })
        .returning()

      await this.replaceSubjectTeachers(created.id, input.teacherIds ?? [], transaction)

      return created
    })

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      teacherIds: input.teacherIds ?? []
    }
  }

  async updateSubject(
    id: string,
    input: Partial<{
      name: string
      description: string | null
      sortOrder: number
      isActive: boolean
      teacherIds: string[]
    }>
  ): Promise<SubjectListItem> {
    const slug = input.name !== undefined
      ? input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : undefined

    const row = await this.database.transaction(async (transaction) => {
      const [updated] = await transaction
        .update(subjects)
        .set({
          name: input.name !== undefined ? input.name : undefined,
          slug: slug !== undefined ? slug : undefined,
          description: input.description !== undefined ? input.description : undefined,
          sortOrder: input.sortOrder !== undefined ? input.sortOrder : undefined,
          isActive: input.isActive !== undefined ? input.isActive : undefined,
          updatedAt: new Date()
        })
        .where(eq(subjects.id, id))
        .returning()

      if (input.teacherIds !== undefined) {
        await this.replaceSubjectTeachers(id, input.teacherIds, transaction)
      }

      return updated
    })

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      teacherIds: input.teacherIds !== undefined ? input.teacherIds : await this.listTeacherIdsBySubjectId(row.id)
    }
  }

  async deleteSubject(id: string): Promise<void> {
    await this.database.delete(subjects).where(eq(subjects.id, id))
  }

  async listTeacherIdsBySubjectId(subjectId: string): Promise<string[]> {
    const rows = await this.database
      .select({ teacherId: subjectTeacherAssignments.teacherId })
      .from(subjectTeacherAssignments)
      .where(eq(subjectTeacherAssignments.subjectId, subjectId))
      .orderBy(asc(subjectTeacherAssignments.teacherId))

    return rows.map((row) => row.teacherId)
  }

  async teacherCanAccessSubject(subjectId: string, teacherId: string): Promise<boolean> {
    const [row] = await this.database
      .select({
        assignmentCount: sql<number>`count(*)`,
        matchedCount: sql<number>`count(*) filter (where ${subjectTeacherAssignments.teacherId} = ${teacherId})`
      })
      .from(subjectTeacherAssignments)
      .where(eq(subjectTeacherAssignments.subjectId, subjectId))

    const assignmentCount = Number(row?.assignmentCount ?? 0)
    const matchedCount = Number(row?.matchedCount ?? 0)

    return assignmentCount === 0 || matchedCount > 0
  }

  async createModule(input: {
    subjectId: string
    title: string
    description?: string | null
    sortOrder?: number
    isActive?: boolean
  }): Promise<ModuleEntity> {
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const [row] = await this.database
      .insert(modules)
      .values({
        subjectId: input.subjectId,
        title: input.title,
        slug,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true
      })
      .returning()

    return ModuleMapper.toDomain(row)
  }

  async updateModule(
    id: string,
    input: Partial<{
      subjectId: string
      title: string
      description: string | null
      sortOrder: number
      isActive: boolean
    }>
  ): Promise<ModuleEntity> {
    const slug = input.title !== undefined
      ? input.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : undefined

    const [row] = await this.database
      .update(modules)
      .set({
        subjectId: input.subjectId !== undefined ? input.subjectId : undefined,
        title: input.title !== undefined ? input.title : undefined,
        slug: slug !== undefined ? slug : undefined,
        description: input.description !== undefined ? input.description : undefined,
        sortOrder: input.sortOrder !== undefined ? input.sortOrder : undefined,
        isActive: input.isActive !== undefined ? input.isActive : undefined,
        updatedAt: new Date()
      })
      .where(eq(modules.id, id))
      .returning()

    return ModuleMapper.toDomain(row)
  }

  async deleteModule(id: string): Promise<void> {
    await this.database.delete(modules).where(eq(modules.id, id))
  }

  private async attachTeacherIds(rows: Omit<SubjectListItem, 'teacherIds'>[]): Promise<SubjectListItem[]> {
    if (rows.length === 0) {
      return []
    }

    const subjectIds = rows.map((row) => row.id)
    const assignments = await this.database
      .select({
        subjectId: subjectTeacherAssignments.subjectId,
        teacherId: subjectTeacherAssignments.teacherId
      })
      .from(subjectTeacherAssignments)
      .innerJoin(users, eq(users.id, subjectTeacherAssignments.teacherId))
      .where(and(
        inArray(subjectTeacherAssignments.subjectId, subjectIds),
        eq(users.role, 'TEACHER'),
        eq(users.isActive, true)
      ))

    const teacherIdsBySubject = new Map<string, string[]>()

    for (const assignment of assignments) {
      const teacherIds = teacherIdsBySubject.get(assignment.subjectId) ?? []
      teacherIds.push(assignment.teacherId)
      teacherIdsBySubject.set(assignment.subjectId, teacherIds)
    }

    return rows.map((row) => ({
      ...row,
      teacherIds: teacherIdsBySubject.get(row.id) ?? []
    }))
  }

  private async replaceSubjectTeachers(subjectId: string, teacherIds: string[], executor: any): Promise<void> {
    await executor
      .delete(subjectTeacherAssignments)
      .where(eq(subjectTeacherAssignments.subjectId, subjectId))

    const uniqueTeacherIds = Array.from(new Set(teacherIds.filter(Boolean)))

    if (uniqueTeacherIds.length === 0) {
      return
    }

    await executor
      .insert(subjectTeacherAssignments)
      .values(uniqueTeacherIds.map((teacherId) => ({ subjectId, teacherId })))
      .onConflictDoNothing()
  }
}
