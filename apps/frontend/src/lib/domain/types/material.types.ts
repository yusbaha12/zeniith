/*
Tujuan: Menyediakan kontrak tipe ruang belajar frontend fase 3 untuk subject, module, material, dan progress.
Caller: API material frontend, halaman student materi, dan halaman teacher materi.
Dependensi: MaterialType shared.
Main Functions: Menstandarkan payload ruang belajar dari backend fase 3.
Side Effects: Tidak ada; file type murni.
*/

import type { MaterialType } from '@lms-bimbel/shared'

export interface FrontendSubject {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

export interface FrontendModule {
  id: string
  subjectId: string
  title: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

export interface FrontendMaterialSummary {
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
  lastAccessedAt: string | null
}

export interface FrontendModuleMaterials {
  module: FrontendModule
  materials: FrontendMaterialSummary[]
}

export interface FrontendMaterialDetail {
  id: string
  moduleId: string
  title: string
  slug: string
  summary: string | null
  materialType: MaterialType
  estimatedDurationMinutes: number | null
  sortOrder: number
  isPublished: boolean
  contentJson: Record<string, unknown> | null
  attachmentUrl: string | null
  attachmentFileName: string | null
  attachmentContentType: string | null
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
  updatedAt: string
}

export interface TeacherMaterialDetail extends TeacherMaterialListItem {
  contentJson: Record<string, unknown> | null
  attachmentUrl: string | null
  attachmentFileName: string | null
  attachmentContentType: string | null
  estimatedDurationMinutes: number | null
}
