/*
Tujuan: Menyediakan use case fase 7 untuk mengambil semua fitur milik paket tertentu.
Caller: Super admin controller.
Dependensi: IPackageRepository, NotFoundError.
Main Functions: Memastikan paket ada, lalu mengambil semua fiturnya.
Side Effects: Membaca database packages dan package_features.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export class ListPackageFeaturesUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(packageId: string) {
    const pkg = await this.packageRepository.findById(packageId)
    if (!pkg) {
      throw new NotFoundError('Paket belajar')
    }

    const features = await this.packageRepository.listFeaturesByPackageId(packageId)
    return features
  }
}
