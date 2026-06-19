/*
Tujuan: Menyediakan use case fase 7 untuk membuat pengguna baru secara administratif oleh admin/superadmin.
Caller: User management controller.
Dependensi: DB Transaction, IUserRepository, IBranchRepository, dan AuthService.
Main Functions: Memvalidasi data email unik dan branch, lalu menyimpan user baru dengan password terenkripsi.
Side Effects: Menulis tabel users.
*/

import type { Role } from '@lms-bimbel/shared'

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import type { IBranchRepository } from '../../../domain/repositories/branch.repository'
import type { AuthService } from '../../services/auth.service'
import { EmailVO } from '../../../domain/value-objects/email.vo'
import { PasswordVO } from '../../../domain/value-objects/password.vo'
import { AppError } from '../../../shared/errors/app.error'

export interface CreateUserInput {
  branchId: string | null
  name: string
  email: string
  password: string
  phone: string | null
  role: Role
}

export class CreateUserUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly userRepository: IUserRepository,
    private readonly branchRepository: IBranchRepository,
    private readonly authService: AuthService
  ) {}

  async execute(input: CreateUserInput) {
    const email = EmailVO.create(input.email)
    const password = PasswordVO.create(input.password)

    if (input.branchId) {
      const branch = await this.branchRepository.findById(input.branchId)
      if (!branch) {
        throw new AppError('Cabang tidak ditemukan', 404, 'BRANCH_NOT_FOUND')
      }
    }

    const existingUser = await this.userRepository.findByEmail(email.value)
    if (existingUser) {
      throw new AppError('Email sudah terdaftar', 409, 'EMAIL_ALREADY_EXISTS')
    }

    const passwordHash = await this.authService.hashPassword(password.value)

    return this.database.transaction(async (transaction) => {
      const user = await this.userRepository.create({
        branchId: input.branchId,
        name: input.name.trim(),
        email: email.value,
        passwordHash,
        phone: input.phone ? input.phone.trim() : null,
        role: input.role,
        isActive: true
      }, transaction)

      return {
        id: user.id,
        branchId: user.branchId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      }
    })
  }
}
