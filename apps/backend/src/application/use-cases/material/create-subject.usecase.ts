/*
Tujuan: Menyediakan use case fase 7 untuk membuat mata pelajaran baru.
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Menyimpan mata pelajaran baru ke database.
Side Effects: Menulis ke database PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export interface CreateSubjectInput {
  name: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
}

export class CreateSubjectUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(input: CreateSubjectInput) {
    return this.moduleRepository.createSubject(input)
  }
}
