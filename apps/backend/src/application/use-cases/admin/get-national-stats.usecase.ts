/*
Tujuan: Menyediakan use case fase 7 untuk mengambil statistik dashboard global/nasional Super Admin.
Caller: Super admin controller.
Dependensi: Admin repository.
Main Functions: Membaca statistik performa nasional, jumlah cabang aktif, keaktifan murid global, dan total pendaftaran.
Side Effects: Membaca database PostgreSQL.
*/

import type { IAdminRepository } from '../../../domain/repositories/admin.repository'

export class GetNationalStatsUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute() {
    return this.adminRepository.getNationalStats()
  }
}
