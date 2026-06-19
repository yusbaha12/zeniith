/*
Tujuan: Menyediakan use case fase 7 untuk memperbarui data modul.
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Menyimpan perubahan data modul ke database.
Side Effects: Memperbarui database PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export interface UpdateModuleInput {
  id: string
  subjectId?: string
  title?: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
}

export class UpdateModuleUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(input: UpdateModuleInput) {
    return this.moduleRepository.updateModule(input.id, {
      subjectId: input.subjectId,
      title: input.title,
      description: input.description,
      sortOrder: input.sortOrder,
      isActive: input.isActive
    })
  }
}
