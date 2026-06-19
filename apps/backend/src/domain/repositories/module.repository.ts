/*
Tujuan: Mendefinisikan kontrak repository subject dan module fase 3 untuk ruang belajar.
Caller: Use case daftar subject/module dan teacher form materi.
Dependensi: ModuleEntity.
Main Functions: Menyediakan operasi baca subject aktif dan module per subject.
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
}

export interface IModuleRepository {
  listActiveSubjects(): Promise<SubjectListItem[]>
  listModulesBySubjectId(subjectId: string): Promise<ModuleEntity[]>
  findModuleById(moduleId: string): Promise<ModuleEntity | null>
  listAllSubjects(): Promise<SubjectListItem[]>
  createSubject(input: {
    name: string
    description?: string | null
    sortOrder?: number
    isActive?: boolean
  }): Promise<SubjectListItem>
  updateSubject(
    id: string,
    input: Partial<{
      name: string
      description: string | null
      sortOrder: number
      isActive: boolean
    }>
  ): Promise<SubjectListItem>
  deleteSubject(id: string): Promise<void>
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
