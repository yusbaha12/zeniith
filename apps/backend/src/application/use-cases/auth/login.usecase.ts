/*
Tujuan: Menangani login user fase 1 dan menghasilkan token akses/refresh.
Caller: Auth controller.
Dependensi: IUserRepository dan AuthService.
Main Functions: Validasi kredensial, status akun, lalu kembalikan token serta profil aman user.
Side Effects: Membaca tabel users dan menghasilkan JWT.
*/

import type { IUserRepository } from '../../../domain/repositories/user.repository'
import { EmailVO } from '../../../domain/value-objects/email.vo'
import { AppError, UnauthorizedError } from '../../../shared/errors/app.error'
import type { AuthService } from '../../services/auth.service'

interface LoginInput {
  email: string
  password: string
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService
  ) {}

  async execute(input: LoginInput) {
    const email = EmailVO.create(input.email)
    const user = await this.userRepository.findByEmail(email.value)

    if (!user) {
      throw new UnauthorizedError('Email atau password salah')
    }

    if (!user.isActive) {
      throw new AppError('Akun Anda sedang dinonaktifkan', 403, 'ACCOUNT_INACTIVE')
    }

    const isPasswordValid = await this.authService.verifyPassword(input.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedError('Email atau password salah')
    }

    const accessToken = await this.authService.generateAccessToken({
      id: user.id,
      role: user.role,
      branchId: user.branchId
    })
    const refreshToken = await this.authService.generateRefreshToken({
      id: user.id,
      role: user.role,
      branchId: user.branchId
    })

    return {
      accessToken,
      refreshToken,
      user: user.toSafeProfile()
    }
  }
}
