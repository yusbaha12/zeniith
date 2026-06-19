/*
Tujuan: Menangani ganti password user sendiri dengan verifikasi password lama dan transaksi update.
Caller: User controller.
Dependensi: AppDatabase, IUserRepository, AuthService, PasswordVO.
Main Functions: Memastikan password lama benar, password baru valid, lalu update hash secara atomik.
Side Effects: Menulis kolom password_hash pada tabel users dalam transaksi PostgreSQL.
*/

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import { PasswordVO } from '../../../domain/value-objects/password.vo'
import { UnauthorizedError } from '../../../shared/errors/app.error'
import type { AuthService } from '../../services/auth.service'

interface UpdatePasswordInput {
  userId: string
  currentPassword: string
  newPassword: string
}

export class UpdatePasswordUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService
  ) {}

  async execute(input: UpdatePasswordInput) {
    const user = await this.userRepository.findById(input.userId)

    if (!user) {
      throw new UnauthorizedError('Sesi pengguna tidak ditemukan')
    }

    const isCurrentPasswordValid = await this.authService.verifyPassword(input.currentPassword, user.passwordHash)

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Password saat ini tidak sesuai')
    }

    const password = PasswordVO.create(input.newPassword)
    const passwordHash = await this.authService.hashPassword(password.value)

    await this.database.transaction(async (transaction) => {
      await this.userRepository.updatePassword(user.id, passwordHash, transaction)
    })

    return null
  }
}
