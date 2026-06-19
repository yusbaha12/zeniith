/*
Tujuan: Menyediakan use case fase 7 untuk menghapus fitur paket.
Caller: Super admin controller.
Dependensi: IPackageRepository, NotFoundError.
Main Functions: Menghapus data fitur dari database.
Side Effects: Menulis tabel package_features (operasi DELETE).
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export class DeletePackageFeatureUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(id: string) {
    const existing = await this.packageRepository.findFeatureById(id)
    if (!existing) {
      throw new NotFoundError('Fitur paket')
    }

    await this.packageRepository.deleteFeature(id)
  }
}
