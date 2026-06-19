/*
Tujuan: Menyediakan use case fase 7 untuk mengambil statistik dashboard admin cabang (rata-rata skor try out, jumlah murid aktif).
Caller: Admin controller (admin cabang).
Dependensi: Admin repository.
Main Functions: Membaca statistik performa dan keaktifan murid di cabang tersebut.
Side Effects: Membaca database PostgreSQL.
*/

import type { IAdminRepository } from '../../../domain/repositories/admin.repository'

export interface GetBranchStatsInput {
  branchId: string
}

export class GetBranchStatsUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(input: GetBranchStatsInput) {
    return this.adminRepository.getBranchStats(input.branchId)
  }
}
