/*
Tujuan: Menyediakan daftar seluruh cabang (aktif maupun nonaktif) fase 7 untuk Super Admin.
Caller: Super admin controller.
Dependensi: IBranchRepository.
Main Functions: Mengambil semua cabang dari database untuk manajemen data cabang.
Side Effects: Membaca tabel branches.
*/

import type { IBranchRepository } from '../../../domain/repositories/branch.repository'

export class ListAllBranchesUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute() {
    const branches = await this.branchRepository.listAll()

    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      isActive: branch.isActive
    }))
  }
}
