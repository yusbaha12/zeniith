/*
Tujuan: Mendefinisikan kontrak repository subject, module, dan PIC guru fase 3/7 untuk ruang belajar.
Caller: Use case daftar subject/module, teacher form materi, dan superadmin curriculum management.
Dependensi: ModuleEntity.
Main Functions: Menyediakan operasi baca/tulis subject, module, assignment guru, dan pengecekan akses guru.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { ModuleEntity } from '../entities/module.entity'

export interface SubjectListItem {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
  teacherIds?: string[]
}

export interface IModuleRepository {
  listActiveSubjects(): Promise<SubjectListItem[]>
  listActiveSubjectsForTeacher(teacherId: string): Promise<SubjectListItem[]>
  listModulesBySubjectId(subjectId: string): Promise<ModuleEntity[]>
  findModuleById(moduleId: string): Promise<ModuleEntity | null>
  listAllSubjects(): Promise<SubjectListItem[]>
  createSubject(input: {
    name: string
    description?: string | null
    sortOrder?: number
    isActive?: boolean
    teacherIds?: string[]
  }): Promise<SubjectListItem>
  updateSubject(
    id: string,
    input: Partial<{
      name: string
      description: string | null
      sortOrder: number
      isActive: boolean
      teacherIds: string[]
    }>
  ): Promise<SubjectListItem>
  deleteSubject(id: string): Promise<void>
  listTeacherIdsBySubjectId(subjectId: string): Promise<string[]>
  teacherCanAccessSubject(subjectId: string, teacherId: string): Promise<boolean>
  createModule(input: {
    subjectId: string
    title: string
    description?: string | null
    sortOrder?: number
    isActive?: boolean
  }): Promise<ModuleEntity>
  updateModule(
    id: string,
    input: Partial<{
      subjectId: string
      title: string
      description: string | null
      sortOrder: number
      isActive: boolean
    }>
  ): Promise<ModuleEntity>
  deleteModule(id: string): Promise<void>
}
