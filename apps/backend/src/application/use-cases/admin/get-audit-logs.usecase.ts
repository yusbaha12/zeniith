/*
Tujuan: Menyediakan use case fase 7 untuk mengambil riwayat audit log otorisasi/perubahan permission.
Caller: Super admin controller.
Dependensi: Admin repository.
Main Functions: Mengambil log perubahan permission sensitif terbaru di sistem.
Side Effects: Membaca database PostgreSQL.
*/

import type { IAdminRepository } from '../../../domain/repositories/admin.repository'

export interface GetAuditLogsInput {
  limit?: number
}

export class GetAuditLogsUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(input: GetAuditLogsInput) {
    const limit = input.limit ?? 50
    return this.adminRepository.getAuditLogs(limit)
  }
}
