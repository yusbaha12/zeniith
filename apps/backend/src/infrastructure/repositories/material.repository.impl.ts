/*
Tujuan: Menyediakan implementasi repository materi/progress berbasis Drizzle untuk fase 3 dan manajemen materi superadmin.
Caller: Use case student materials, track progress, teacher CRUD materi, dan superadmin material management.
Dependensi: AppDatabase, schema materials/material_progresses/modules/subjects, dan MaterialMapper.
Main Functions: Menjalankan query material student, teacher, dan admin global dengan join minimum cost serta upsert progress per user.
Side Effects: Membaca dan menulis tabel materials dan material_progresses pada PostgreSQL.
*/

import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'

import type {
  CreateMaterialInput,
  IMaterialRepository,
  MaterialListItem,
  TeacherMaterialListItem,
  UpdateMaterialInput,
  UpsertMaterialProgressInput
} from '../../domain/repositories/material.repository'
import type { MaterialEntity } from '../../domain/entities/material.entity'
import type { AppDatabase } from '../database/connection'
import { materialProgresses, materials, modules, subjectTeacherAssignments, subjects } from '../database/schema'
import { MaterialMapper } from '../mappers/material.mapper'

export class MaterialRepositoryImpl implements IMaterialRepository {
  constructor(private readonly database: AppDatabase) {}

  async listByModuleId(moduleId: string, userId: string): Promise<MaterialListItem[]> {
    return this.database
      .select({
        id: materials.id,
        moduleId: materials.moduleId,
        title: materials.title,
        slug: materials.slug,
        summary: materials.summary,
        materialType: materials.materialType,
        estimatedDurationMinutes: materials.estimatedDurationMinutes,
        sortOrder: materials.sortOrder,
        isPublished: materials.isPublished,
        isCompleted: sql<boolean>`coalesce(${materialProgresses.isCompleted}, false)`,
        progressPercent: sql<number>`coalesce(${materialProgresses.progressPercent}, 0)`,
        lastAccessedAt: materialProgresses.lastAccessedAt
      })
      .from(materials)
      .leftJoin(
        materialProgresses,
        and(
          eq(materialProgresses.materialId, materials.id),
          eq(materialProgresses.userId, userId)
        )
      )
      .where(and(eq(materials.moduleId, moduleId), eq(materials.isPublished, true)))
      .orderBy(asc(materials.sortOrder), asc(materials.createdAt))
  }

  async findById(materialId: string): Promise<MaterialEntity | null> {
    const [row] = await this.database
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1)

    return row ? MaterialMapper.toDomain(row) : null
  }

  async findTeacherListItemById(materialId: string): Promise<TeacherMaterialListItem | null> {
    const [row] = await this.database
      .select({
        id: materials.id,
        moduleId: materials.moduleId,
        moduleTitle: modules.title,
        subjectId: subjects.id,
        subjectName: subjects.name,
        branchId: materials.branchId,
        title: materials.title,
        slug: materials.slug,
        summary: materials.summary,
        materialType: materials.materialType,
        sortOrder: materials.sortOrder,
        isPublished: materials.isPublished,
        updatedAt: materials.updatedAt
      })
      .from(materials)
      .innerJoin(modules, eq(modules.id, materials.moduleId))
      .innerJoin(subjects, eq(subjects.id, modules.subjectId))
      .where(eq(materials.id, materialId))
      .limit(1)

    return row ?? null
  }

  async listByTeacher(teacherId: string, branchId: string | null): Promise<TeacherMaterialListItem[]> {
    return this.database
      .select({
        id: materials.id,
        moduleId: materials.moduleId,
        moduleTitle: modules.title,
        subjectId: subjects.id,
        subjectName: subjects.name,
        branchId: materials.branchId,
        title: materials.title,
        slug: materials.slug,
        summary: materials.summary,
        materialType: materials.materialType,
        sortOrder: materials.sortOrder,
        isPublished: materials.isPublished,
        updatedAt: materials.updatedAt
      })
      .from(materials)
      .innerJoin(modules, eq(modules.id, materials.moduleId))
      .innerJoin(subjects, eq(subjects.id, modules.subjectId))
      .where(and(
        eq(materials.createdBy, teacherId),
        branchId ? eq(materials.branchId, branchId) : undefined,
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
      .orderBy(desc(materials.updatedAt))
  }

  async listAllForAdmin(filters: { moduleId?: string; subjectId?: string; isPublished?: boolean; searchQuery?: string } = {}): Promise<TeacherMaterialListItem[]> {
    const searchQuery = filters.searchQuery?.trim()

    return this.database
      .select({
        id: materials.id,
        moduleId: materials.moduleId,
        moduleTitle: modules.title,
        subjectId: subjects.id,
        subjectName: subjects.name,
        branchId: materials.branchId,
        title: materials.title,
        slug: materials.slug,
        summary: materials.summary,
        materialType: materials.materialType,
        sortOrder: materials.sortOrder,
        isPublished: materials.isPublished,
        updatedAt: materials.updatedAt
      })
      .from(materials)
      .innerJoin(modules, eq(modules.id, materials.moduleId))
      .innerJoin(subjects, eq(subjects.id, modules.subjectId))
      .where(and(
        filters.moduleId ? eq(materials.moduleId, filters.moduleId) : undefined,
        filters.subjectId ? eq(subjects.id, filters.subjectId) : undefined,
        typeof filters.isPublished === 'boolean' ? eq(materials.isPublished, filters.isPublished) : undefined,
        searchQuery
          ? or(
              ilike(materials.title, `%${searchQuery}%`),
              ilike(materials.summary, `%${searchQuery}%`),
              ilike(modules.title, `%${searchQuery}%`),
              ilike(subjects.name, `%${searchQuery}%`)
            )
          : undefined
      ))
      .orderBy(desc(materials.updatedAt))
  }

  async create(input: CreateMaterialInput, executor?: unknown): Promise<MaterialEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .insert(materials)
      .values({
        moduleId: input.moduleId,
        branchId: input.branchId,
        createdBy: input.createdBy,
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        materialType: input.materialType,
        contentJson: input.contentJson,
        attachmentObjectKey: input.attachmentObjectKey ?? null,
        attachmentFileName: input.attachmentFileName ?? null,
        attachmentContentType: input.attachmentContentType ?? null,
        estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
        sortOrder: input.sortOrder ?? 0,
        isPublished: input.isPublished ?? false
      })
      .returning()

    return MaterialMapper.toDomain(row)
  }

  async update(materialId: string, input: UpdateMaterialInput, executor?: unknown): Promise<MaterialEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .update(materials)
      .set({
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        materialType: input.materialType,
        contentJson: input.contentJson,
        attachmentObjectKey: input.attachmentObjectKey ?? null,
        attachmentFileName: input.attachmentFileName ?? null,
        attachmentContentType: input.attachmentContentType ?? null,
        estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
        sortOrder: input.sortOrder ?? 0,
        isPublished: input.isPublished ?? false,
        updatedAt: new Date()
      })
      .where(eq(materials.id, materialId))
      .returning()

    return MaterialMapper.toDomain(row)
  }

  async delete(materialId: string, executor?: unknown): Promise<void> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    await database.delete(materials).where(eq(materials.id, materialId))
  }

  async upsertProgress(input: UpsertMaterialProgressInput, executor?: unknown): Promise<void> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const now = new Date()
    await database
      .insert(materialProgresses)
      .values({
        userId: input.userId,
        materialId: input.materialId,
        progressPercent: input.progressPercent,
        isCompleted: input.isCompleted,
        completedAt: input.isCompleted ? now : null,
        lastAccessedAt: now
      })
      .onConflictDoUpdate({
        target: [materialProgresses.userId, materialProgresses.materialId],
        set: {
          progressPercent: input.progressPercent,
          isCompleted: input.isCompleted,
          completedAt: input.isCompleted ? now : null,
          lastAccessedAt: now,
          updatedAt: now
        }
      })
  }
}
