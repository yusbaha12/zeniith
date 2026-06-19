/*
Tujuan: Menyediakan use case fase 7 untuk mengambil semua mata pelajaran yang terhubung dengan paket tertentu.
Caller: Super admin controller.
Dependensi: IPackageRepository, NotFoundError.
Main Functions: Memastikan paket ada, lalu mengambil semua ID mata pelajaran yang terhubung.
Side Effects: Membaca database package_subjects.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export class ListPackageSubjectsUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(packageId: string) {
    const pkg = await this.packageRepository.findById(packageId)
    if (!pkg) {
      throw new NotFoundError('Paket belajar')
    }

    const subjectIds = await this.packageRepository.listSubjectsByPackageId(packageId)
    return subjectIds
  }
}
