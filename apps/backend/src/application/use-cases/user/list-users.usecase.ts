/*
Tujuan: Menyediakan use case fase 7 untuk mendaftar pengguna (siswa/guru/admin) dengan filter peran dan cabang.
Caller: User management controller.
Dependensi: User repository.
Main Functions: Membaca daftar pengguna dari database berdasarkan filter peran, cabang, dan keyword pencarian.
Side Effects: Membaca tabel users.
*/

import type { Role } from '@lms-bimbel/shared'

import type { IUserRepository } from '../../../domain/repositories/user.repository'

export interface ListUsersInput {
  role?: Role
  branchId?: string | null
  searchQuery?: string
  page?: number
  limit?: number
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ListUsersInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 10
    const offset = (page - 1) * limit

    const { items, total } = await this.userRepository.listUsers({
      role: input.role,
      branchId: input.branchId,
      searchQuery: input.searchQuery,
      limit,
      offset
    })

    return {
      items: items.map((user) => ({
        id: user.id,
        branchId: user.branchId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}
