/*
Tujuan: Menyediakan use case fase 7 untuk membuat modul baru di dalam mata pelajaran.
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Menyimpan modul baru ke database.
Side Effects: Menulis ke database PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export interface CreateModuleInput {
  subjectId: string
  title: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
}

export class CreateModuleUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(input: CreateModuleInput) {
    return this.moduleRepository.createModule(input)
  }
}
