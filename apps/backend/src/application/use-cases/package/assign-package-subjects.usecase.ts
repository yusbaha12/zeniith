/*
Tujuan: Menyediakan use case fase 7 untuk memperbarui pemetaan mata pelajaran pada suatu paket secara transaksional.
Caller: Super admin controller.
Dependensi: IPackageRepository, NotFoundError, AppDatabase.
Main Functions: Menyimpan daftar mata pelajaran untuk suatu paket dalam satu transaksi db.
Side Effects: Mengubah data pada tabel package_subjects.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'
import type { AppDatabase } from '../../../infrastructure/database/connection'

export class AssignPackageSubjectsUseCase {
  constructor(
    private readonly packageRepository: IPackageRepository,
    private readonly database: AppDatabase
  ) {}

  async execute(packageId: string, subjectIds: string[]): Promise<void> {
    const pkg = await this.packageRepository.findById(packageId)
    if (!pkg) {
      throw new NotFoundError('Paket belajar')
    }

    try {
      await this.database.transaction(async (tx) => {
        await this.packageRepository.assignSubjects(packageId, subjectIds, tx)
      })
    } catch (err) {
      console.error('[AssignPackageSubjectsUseCase] Transaction failed:', err)
      throw err
    }
  }
}
