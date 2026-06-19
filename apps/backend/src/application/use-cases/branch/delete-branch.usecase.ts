/*
Tujuan: Menyediakan use case fase 7 untuk menghapus cabang.
Caller: Super admin controller.
Dependensi: IBranchRepository.
Main Functions: Menghapus cabang dari database dengan penanganan error jika memiliki data relasi.
Side Effects: Menghapus row branches di PostgreSQL.
*/

import type { IBranchRepository } from '../../../domain/repositories/branch.repository'
import { AppError } from '../../../shared/errors/app.error'

export class DeleteBranchUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(id: string): Promise<{ success: boolean }> {
    const branch = await this.branchRepository.findById(id)
    if (!branch) {
      throw new AppError('Cabang tidak ditemukan', 404, 'BRANCH_NOT_FOUND')
    }

    try {
      await this.branchRepository.delete(id)
      return { success: true }
    } catch (err) {
      throw new AppError(
        'Tidak dapat menghapus cabang karena masih memiliki data pengguna terdaftar. Silakan nonaktifkan cabang ini saja.',
        400,
        'DELETE_RESTRICTED'
      )
    }
  }
}
