/*
Tujuan: Menyediakan use case fase 7 untuk mengupdate data cabang.
Caller: Super admin controller.
Dependensi: IBranchRepository.
Main Functions: Memperbarui data cabang di database.
Side Effects: Menulis tabel branches.
*/

import type { IBranchRepository } from '../../../domain/repositories/branch.repository'
import { AppError } from '../../../shared/errors/app.error'

export interface UpdateBranchInput {
  id: string
  name?: string
  code?: string
  address?: string | null
  city?: string | null
  phone?: string | null
  isActive?: boolean
}

export class UpdateBranchUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(input: UpdateBranchInput) {
    const branch = await this.branchRepository.findById(input.id)
    if (!branch) {
      throw new AppError('Cabang tidak ditemukan', 404, 'BRANCH_NOT_FOUND')
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.code !== undefined) updateData.code = input.code.trim().toUpperCase()
    if (input.address !== undefined) updateData.address = input.address ? input.address.trim() : null
    if (input.city !== undefined) updateData.city = input.city ? input.city.trim() : null
    if (input.phone !== undefined) updateData.phone = input.phone ? input.phone.trim() : null
    if (input.isActive !== undefined) updateData.isActive = input.isActive

    const updated = await this.branchRepository.update(input.id, updateData)

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      address: updated.address,
      city: updated.city,
      phone: updated.phone,
      isActive: updated.isActive
    }
  }
}
