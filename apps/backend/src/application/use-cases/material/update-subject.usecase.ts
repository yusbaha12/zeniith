/*
Tujuan: Menyediakan use case fase 7 untuk memperbarui data mata pelajaran dan PIC guru opsional.
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Menyimpan perubahan mata pelajaran dan mengganti assignment guru bila dikirim.
Side Effects: Memperbarui tabel subjects dan subject_teacher_assignments pada PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export interface UpdateSubjectInput {
  id: string
  name?: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
  teacherIds?: string[]
}

export class UpdateSubjectUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(input: UpdateSubjectInput) {
    return this.moduleRepository.updateSubject(input.id, {
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      teacherIds: input.teacherIds
    })
  }
}
