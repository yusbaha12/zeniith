/*
Tujuan: Menyediakan implementasi repository subject/module berbasis Drizzle untuk ruang belajar fase 3.
Caller: Use case daftar subject/module dan teacher form materi.
Dependensi: AppDatabase, schema subjects/modules, dan ModuleMapper.
Main Functions: Menjalankan query subject aktif dan module terurut dengan indeks baca minimum cost.
Side Effects: Membaca tabel subjects dan modules pada PostgreSQL.
*/

import { asc, eq } from 'drizzle-orm'

import type { IModuleRepository, SubjectListItem } from '../../domain/repositories/module.repository'
import type { ModuleEntity } from '../../domain/entities/module.entity'
import type { AppDatabase } from '../database/connection'
import { modules, subjects } from '../database/schema'
import { ModuleMapper } from '../mappers/module.mapper'

export class ModuleRepositoryImpl implements IModuleRepository {
  constructor(private readonly database: AppDatabase) {}

  async listActiveSubjects(): Promise<SubjectListItem[]> {
    return this.database
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
    return this.database
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
  }

  async createSubject(input: {
    name: string
    description?: string | null
    sortOrder?: number
    isActive?: boolean
  }): Promise<SubjectListItem> {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const [row] = await this.database
      .insert(subjects)
      .values({
        name: input.name,
        slug,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true
      })
      .returning()

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sortOrder: row.sortOrder,
      isActive: row.isActive
    }
  }

  async updateSubject(
    id: string,
    input: Partial<{
      name: string
      description: string | null
      sortOrder: number
      isActive: boolean
    }>
  ): Promise<SubjectListItem> {
    const slug = input.name !== undefined
      ? input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : undefined

    const [row] = await this.database
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

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sortOrder: row.sortOrder,
      isActive: row.isActive
    }
  }

  async deleteSubject(id: string): Promise<void> {
    await this.database.delete(subjects).where(eq(subjects.id, id))
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
}
