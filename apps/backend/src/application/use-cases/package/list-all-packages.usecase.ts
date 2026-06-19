/*
Tujuan: Menyediakan daftar seluruh paket (aktif maupun nonaktif) fase 7 untuk Super Admin.
Caller: Super admin controller.
Dependensi: IPackageRepository.
Main Functions: Mengambil semua paket dari database.
Side Effects: Membaca tabel packages.
*/

import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export class ListAllPackagesUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute() {
    const packages = await this.packageRepository.listAll()

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      description: pkg.description,
      price: pkg.price,
      durationDays: pkg.durationDays,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder
    }))
  }
}
