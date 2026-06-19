/*
Tujuan: Menangani update profil user sendiri dengan transaksi aman.
Caller: User controller.
Dependensi: AppDatabase dan IUserRepository.
Main Functions: Memutakhirkan nama dan nomor telepon profil sendiri secara atomik.
Side Effects: Menulis tabel users dalam transaksi PostgreSQL.
*/

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import { NotFoundError } from '../../../shared/errors/app.error'

interface UpdateProfileInput {
  userId: string
  name: string
  phone: string
}

export class UpdateProfileUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: UpdateProfileInput) {
    const existingUser = await this.userRepository.findById(input.userId)

    if (!existingUser) {
      throw new NotFoundError('Profil')
    }

    return this.database.transaction(async (transaction) => {
      const user = await this.userRepository.updateProfile(existingUser.id, {
        name: input.name.trim(),
        phone: input.phone.trim()
      }, transaction)

      return user.toSafeProfile()
    })
  }
}
