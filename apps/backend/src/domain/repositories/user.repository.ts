/*
Tujuan: Mendefinisikan kontrak repository user untuk auth dan profile fase 1.
Caller: Use case auth/profile dan middleware auth.
Dependensi: UserEntity domain.
Main Functions: Menyediakan operasi baca/tulis user yang dibutuhkan auth dan profile.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { Role } from '@lms-bimbel/shared'

import type { UserEntity } from '../entities/user.entity'

export interface CreateUserInput {
  branchId: string | null
  name: string
  email: string
  passwordHash: string
  phone: string | null
  role: Role
  avatarUrl?: string | null
  isActive?: boolean
}

export interface UpdateProfileInput {
  name: string
  phone: string | null
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  create(input: CreateUserInput, executor?: unknown): Promise<UserEntity>
  updateProfile(id: string, input: UpdateProfileInput, executor?: unknown): Promise<UserEntity>
  updatePassword(id: string, passwordHash: string, executor?: unknown): Promise<void>
  listUsers(filter: { role?: Role; branchId?: string | null; searchQuery?: string; limit?: number; offset?: number }): Promise<{ items: UserEntity[]; total: number }>
  update(id: string, input: Partial<CreateUserInput>, executor?: unknown): Promise<UserEntity>
  delete(id: string, executor?: unknown): Promise<void>
}
