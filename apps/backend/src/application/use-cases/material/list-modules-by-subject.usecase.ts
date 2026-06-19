/*
Tujuan: Menyediakan use case daftar modul per subject fase 3.
Caller: Material controller student dan teacher.
Dependensi: IModuleRepository dan NotFoundError.
Main Functions: Mengambil modul terurut untuk satu mata pelajaran aktif.
Side Effects: Membaca tabel modules melalui repository.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export class ListModulesBySubjectUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(subjectId: string) {
    const modules = await this.moduleRepository.listModulesBySubjectId(subjectId)

    if (modules.length === 0) {
      throw new NotFoundError('Modul belajar')
    }

    return modules.map((item) => item.toSummary())
  }
}
