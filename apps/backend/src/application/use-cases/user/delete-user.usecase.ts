/*
Tujuan: Menyediakan use case fase 7 untuk menghapus pengguna secara administratif.
Caller: User management controller.
Dependensi: DB Transaction, IUserRepository, dan AuthorizationService.
Main Functions: Menghapus data user dari database dan membersihkan cache otorisasi di Redis.
Side Effects: Menghapus row users di PostgreSQL dan mendelete cache Redis.
*/

import { AppError } from '../../../shared/errors/app.error'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import type { AuthorizationService } from '../../services/authorization.service'

export interface DeleteUserInput {
  id: string
}

export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

  async execute(input: DeleteUserInput): Promise<{ success: boolean }> {
    const user = await this.userRepository.findById(input.id)
    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404, 'USER_NOT_FOUND')
    }

    try {
      await this.userRepository.delete(input.id)
      await this.authorizationService.invalidateUser(input.id)
      return { success: true }
    } catch (err) {
      // Jika foreign key menghalangi hapus, infokan dengan jelas
      throw new AppError(
        'Tidak dapat menghapus pengguna karena memiliki data relasi (seperti transaksi atau sesi ujian). Silakan nonaktifkan akun ini saja.',
        400,
        'DELETE_RESTRICTED'
      )
    }
  }
}
