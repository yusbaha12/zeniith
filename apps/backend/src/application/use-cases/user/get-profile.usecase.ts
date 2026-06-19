/*
Tujuan: Mengambil profil user sendiri pada fase 1.
Caller: User controller.
Dependensi: IUserRepository.
Main Functions: Mengambil user berdasarkan id dan mengembalikan profil aman.
Side Effects: Membaca tabel users.
*/

import type { IUserRepository } from '../../../domain/repositories/user.repository'
import { NotFoundError } from '../../../shared/errors/app.error'

export class GetProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new NotFoundError('Profil')
    }

    return user.toSafeProfile()
  }
}
