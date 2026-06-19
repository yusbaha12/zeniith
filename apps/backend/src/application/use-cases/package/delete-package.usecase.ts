/*
Tujuan: Menyediakan use case fase 7 untuk menghapus paket.
Caller: Super admin controller.
Dependensi: IPackageRepository.
Main Functions: Menghapus paket dari database dengan penanganan error jika memiliki data relasi.
Side Effects: Menghapus row packages di PostgreSQL.
*/

import type { IPackageRepository } from '../../../domain/repositories/package.repository'
import { AppError } from '../../../shared/errors/app.error'

export class DeletePackageUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(id: string): Promise<{ success: boolean }> {
    const pkg = await this.packageRepository.findById(id)
    if (!pkg) {
      throw new AppError('Paket tidak ditemukan', 404, 'PACKAGE_NOT_FOUND')
    }

    try {
      await this.packageRepository.delete(id)
      return { success: true }
    } catch (err) {
      throw new AppError(
        'Tidak dapat menghapus paket karena masih memiliki riwayat pembelian atau langganan aktif. Silakan nonaktifkan paket ini saja.',
        400,
        'DELETE_RESTRICTED'
      )
    }
  }
}
