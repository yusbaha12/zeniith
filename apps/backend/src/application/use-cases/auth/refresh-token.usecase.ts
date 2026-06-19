/*
Tujuan: Menangani refresh token fase 1 dan menghasilkan access token baru untuk sesi aktif.
Caller: Auth controller.
Dependensi: IUserRepository dan AuthService.
Main Functions: Memverifikasi refresh token, cek status user, lalu keluarkan access token baru.
Side Effects: Membaca user dan menghasilkan JWT baru.
*/

import { UnauthorizedError } from '../../../shared/errors/app.error'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import type { AuthService } from '../../services/auth.service'

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService
  ) {}

  async execute(refreshToken: string) {
    const payload = await this.authService.verifyRefreshToken(refreshToken)

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedError('Refresh token tidak valid')
    }

    const user = await this.userRepository.findById(payload.sub)

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Sesi tidak valid atau akun tidak aktif')
    }

    const accessToken = await this.authService.generateAccessToken({
      id: user.id,
      role: user.role,
      branchId: user.branchId
    })

    return {
      accessToken,
      user: user.toSafeProfile()
    }
  }
}
