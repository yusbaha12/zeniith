/*
Tujuan: Menyediakan use case fase 7 untuk memperbarui data profil/akses pengguna lain secara administratif.
Caller: User management controller.
Dependensi: DB Transaction, IUserRepository, IBranchRepository, AuthService, dan AuthorizationService.
Main Functions: Memperbarui data pengguna di DB dan menginvalidasi cache otorisasi user di Redis.
Side Effects: Menulis tabel users dan menghapus cache otorisasi Redis.
*/

import type { Role } from '@lms-bimbel/shared'

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import type { IBranchRepository } from '../../../domain/repositories/branch.repository'
import type { AuthService } from '../../services/auth.service'
import type { AuthorizationService } from '../../services/authorization.service'
import { EmailVO } from '../../../domain/value-objects/email.vo'
import { PasswordVO } from '../../../domain/value-objects/password.vo'
import { AppError } from '../../../shared/errors/app.error'

export interface UpdateUserInput {
  id: string
  branchId?: string | null
  name?: string
  email?: string
  password?: string
  phone?: string | null
  role?: Role
  isActive?: boolean
}

export class UpdateUserUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly userRepository: IUserRepository,
    private readonly branchRepository: IBranchRepository,
    private readonly authService: AuthService,
    private readonly authorizationService: AuthorizationService
  ) {}

  async execute(input: UpdateUserInput) {
    const user = await this.userRepository.findById(input.id)
    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404, 'USER_NOT_FOUND')
    }

    const updateData: any = {}

    if (input.email !== undefined) {
      const email = EmailVO.create(input.email)
      if (email.value !== user.email) {
        const existing = await this.userRepository.findByEmail(email.value)
        if (existing) {
          throw new AppError('Email sudah terdaftar', 409, 'EMAIL_ALREADY_EXISTS')
        }
        updateData.email = email.value
      }
    }

    if (input.branchId !== undefined) {
      if (input.branchId !== null) {
        const branch = await this.branchRepository.findById(input.branchId)
        if (!branch) {
          throw new AppError('Cabang tidak ditemukan', 404, 'BRANCH_NOT_FOUND')
        }
      }
      updateData.branchId = input.branchId
    }

    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.phone !== undefined) updateData.phone = input.phone ? input.phone.trim() : null
    if (input.role !== undefined) updateData.role = input.role
    if (input.isActive !== undefined) updateData.isActive = input.isActive

    if (input.password !== undefined && input.password !== '') {
      const password = PasswordVO.create(input.password)
      updateData.passwordHash = await this.authService.hashPassword(password.value)
    }

    return this.database.transaction(async (transaction) => {
      const updated = await this.userRepository.update(input.id, updateData, transaction)
      
      // Invalidasi cache otorisasi user di Redis karena data akses/role berubah
      await this.authorizationService.invalidateUser(input.id)

      return {
        id: updated.id,
        branchId: updated.branchId,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        isActive: updated.isActive
      }
    })
  }
}
