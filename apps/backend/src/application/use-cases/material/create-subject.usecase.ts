/*
Tujuan: Menyediakan use case fase 7 untuk membuat mata pelajaran baru beserta PIC guru opsional.
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Menyimpan mata pelajaran baru dan assignment guru jika dipilih.
Side Effects: Menulis tabel subjects dan subject_teacher_assignments pada PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export interface CreateSubjectInput {
  name: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
  teacherIds?: string[]
}

export class CreateSubjectUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(input: CreateSubjectInput) {
    return this.moduleRepository.createSubject(input)
  }
}
