/*
Tujuan: Menyediakan use case fase 7 untuk memperbarui data mata pelajaran.
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Menyimpan perubahan mata pelajaran ke database.
Side Effects: Memperbarui database PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export interface UpdateSubjectInput {
  id: string
  name?: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
}

export class UpdateSubjectUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(input: UpdateSubjectInput) {
    return this.moduleRepository.updateSubject(input.id, {
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      isActive: input.isActive
    })
  }
}
