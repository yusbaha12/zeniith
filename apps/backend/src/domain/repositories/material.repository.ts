/*
Tujuan: Mendefinisikan kontrak repository materi dan progress fase 3 untuk student dan teacher.
Caller: Use case list/detail material, track progress, dan teacher CRUD materi.
Dependensi: MaterialEntity dan MaterialType shared.
Main Functions: Menyediakan operasi baca/tulis materi, progress, dan listing teacher secara efisien.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { MaterialType } from '@lms-bimbel/shared'

import type { MaterialEntity } from '../entities/material.entity'

export interface MaterialListItem {
  id: string
  moduleId: string
  title: string
  slug: string
  summary: string | null
  materialType: MaterialType
  estimatedDurationMinutes: number | null
  sortOrder: number
  isPublished: boolean
  isCompleted: boolean
  progressPercent: number
  lastAccessedAt: Date | null
}

export interface TeacherMaterialListItem {
  id: string
  moduleId: string
  moduleTitle: string
  subjectId: string
  subjectName: string
  title: string
  slug: string
  summary: string | null
  materialType: MaterialType
  sortOrder: number
  isPublished: boolean
  updatedAt: Date
}

export interface CreateMaterialInput {
  moduleId: string
  branchId: string | null
  createdBy: string
  title: string
  slug: string
  summary: string | null
  materialType: MaterialType
  contentJson: Record<string, unknown> | null
  attachmentObjectKey?: string | null
  attachmentFileName?: string | null
  attachmentContentType?: string | null
  estimatedDurationMinutes?: number | null
  sortOrder?: number
  isPublished?: boolean
}

export interface UpdateMaterialInput {
  title: string
  slug: string
  summary: string | null
  materialType: MaterialType
  contentJson: Record<string, unknown> | null
  attachmentObjectKey?: string | null
  attachmentFileName?: string | null
  attachmentContentType?: string | null
  estimatedDurationMinutes?: number | null
  sortOrder?: number
  isPublished?: boolean
}

export interface UpsertMaterialProgressInput {
  userId: string
  materialId: string
  progressPercent: number
  isCompleted: boolean
}

export interface IMaterialRepository {
  listByModuleId(moduleId: string, userId: string): Promise<MaterialListItem[]>
  findById(materialId: string): Promise<MaterialEntity | null>
  findTeacherListItemById(materialId: string): Promise<TeacherMaterialListItem | null>
  listByTeacher(teacherId: string, branchId: string | null): Promise<TeacherMaterialListItem[]>
  create(input: CreateMaterialInput, executor?: unknown): Promise<MaterialEntity>
  update(materialId: string, input: UpdateMaterialInput, executor?: unknown): Promise<MaterialEntity>
  delete(materialId: string, executor?: unknown): Promise<void>
  upsertProgress(input: UpsertMaterialProgressInput, executor?: unknown): Promise<void>
}
