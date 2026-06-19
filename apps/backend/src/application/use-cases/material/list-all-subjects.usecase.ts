/*
Tujuan: Menyediakan use case fase 7 untuk mendaftar semua mata pelajaran (aktif & tidak aktif).
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Membaca daftar semua mata pelajaran.
Side Effects: Membaca database PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export class ListAllSubjectsUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute() {
    return this.moduleRepository.listAllSubjects()
  }
}
