/*
Tujuan: Menyediakan use case fase 7 untuk mengekspor laporan murid cabang/nasional dalam format CSV.
Caller: Admin controller (admin cabang & super admin).
Dependensi: Admin repository.
Main Functions: Membaca data laporan murid, memformatnya menjadi baris-baris CSV.
Side Effects: Membaca database PostgreSQL.
*/

import type { IAdminRepository } from '../../../domain/repositories/admin.repository'

export interface ExportBranchReportInput {
  branchId: string | null
}

export class ExportBranchReportUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(input: ExportBranchReportInput): Promise<{ csv: string; filename: string }> {
    const data = await this.adminRepository.getBranchReportData(input.branchId)

    const headers = [
      'ID Murid',
      'Nama Murid',
      'Email',
      'No Telepon',
      'Cabang',
      'Paket Belajar',
      'Status Langganan',
      'Tanggal Kedaluwarsa'
    ]

    const rows = data.map((row) => [
      row.studentId || '',
      `"${(row.studentName || '').replace(/"/g, '""')}"`,
      row.studentEmail || '',
      row.studentPhone || '',
      row.branchName || '',
      row.packageName || '',
      row.subscriptionStatus || '',
      row.expiredAt ? new Date(row.expiredAt).toISOString() : ''
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const filename = input.branchId
      ? `laporan-cabang-${input.branchId}-${new Date().toISOString().slice(0, 10)}.csv`
      : `laporan-nasional-${new Date().toISOString().slice(0, 10)}.csv`

    return {
      csv: csvContent,
      filename
    }
  }
}
