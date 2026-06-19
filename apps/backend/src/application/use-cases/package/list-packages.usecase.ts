/*
Tujuan: Menyediakan use case daftar paket publik fase 2 untuk halaman katalog.
Caller: Package controller publik.
Dependensi: IPackageRepository.
Main Functions: Mengambil paket aktif terurut lalu memetakan ke summary aman untuk frontend.
Side Effects: Membaca tabel packages melalui repository.
*/

import type { PackageSummary } from '../../../domain/entities/package.entity'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export class ListPackagesUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(): Promise<PackageSummary[]> {
    const packages = await this.packageRepository.listActive()
    return packages.map((item) => item.toSummary())
  }
}
