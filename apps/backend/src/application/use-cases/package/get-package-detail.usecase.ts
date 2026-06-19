/*
Tujuan: Menyediakan use case detail paket publik fase 2 untuk halaman detail dan checkout.
Caller: Package controller publik dan checkout frontend.
Dependensi: IPackageRepository dan NotFoundError.
Main Functions: Mengambil satu paket beserta daftar fitur terurut.
Side Effects: Membaca tabel packages dan package_features melalui repository.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export class GetPackageDetailUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(packageId: string) {
    const packageItem = await this.packageRepository.findById(packageId)

    if (!packageItem || !packageItem.isPurchasable()) {
      throw new NotFoundError('Paket belajar')
    }

    const features = await this.packageRepository.listFeaturesByPackageId(packageId)

    return {
      ...packageItem.toSummary(),
      features
    }
  }
}
