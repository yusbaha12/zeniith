/*
Tujuan: Menangani registrasi murid baru fase 1 dengan validasi branch, email unik, dan transaksi insert user.
Caller: Auth controller.
Dependensi: AppDatabase, IUserRepository, IBranchRepository, AuthService, EmailVO, PasswordVO.
Main Functions: Memvalidasi data registrasi lalu menyimpan user STUDENT secara atomik.
Side Effects: Menulis tabel users dalam transaksi PostgreSQL.
*/

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IBranchRepository } from '../../../domain/repositories/branch.repository'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import { EmailVO } from '../../../domain/value-objects/email.vo'
import { PasswordVO } from '../../../domain/value-objects/password.vo'
import { AppError } from '../../../shared/errors/app.error'
import type { AuthService } from '../../services/auth.service'

interface RegisterInput {
  name: string
  email: string
  password: string
  phone: string
  branchId: string
}

export class RegisterUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly userRepository: IUserRepository,
    private readonly branchRepository: IBranchRepository,
    private readonly authService: AuthService
  ) {}

  async execute(input: RegisterInput) {
    const email = EmailVO.create(input.email)
    const password = PasswordVO.create(input.password)

    const branch = await this.branchRepository.findById(input.branchId)

    if (!branch || !branch.canAcceptRegistration()) {
      throw new AppError('Cabang yang dipilih tidak tersedia', 404, 'BRANCH_NOT_FOUND')
    }

    const existingUser = await this.userRepository.findByEmail(email.value)

    if (existingUser) {
      throw new AppError('Email sudah terdaftar', 409, 'EMAIL_ALREADY_EXISTS', {
        email: ['Email sudah terdaftar']
      })
    }

    const passwordHash = await this.authService.hashPassword(password.value)

    return this.database.transaction(async (transaction) => {
      const user = await this.userRepository.create({
        branchId: input.branchId,
        name: input.name.trim(),
        email: email.value,
        passwordHash,
        phone: input.phone.trim(),
        role: 'STUDENT'
      }, transaction)

      return user.toSafeProfile()
    })
  }
}
