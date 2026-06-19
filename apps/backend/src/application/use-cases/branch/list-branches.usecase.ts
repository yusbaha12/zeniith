/*
Tujuan: Menyediakan daftar cabang aktif untuk form registrasi fase 1.
Caller: Branch controller.
Dependensi: IBranchRepository.
Main Functions: Mengambil cabang aktif dan memetakan ke response ringan untuk frontend.
Side Effects: Membaca tabel branches.
*/

import type { IBranchRepository } from '../../../domain/repositories/branch.repository'

export class ListBranchesUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute() {
    const branches = await this.branchRepository.findActive()

    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      city: branch.city
    }))
  }
}
