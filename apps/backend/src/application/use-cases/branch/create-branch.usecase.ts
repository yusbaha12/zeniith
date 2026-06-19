/*
Tujuan: Menyediakan use case fase 7 untuk membuat cabang baru.
Caller: Super admin controller.
Dependensi: IBranchRepository.
Main Functions: Menyimpan data cabang baru ke database.
Side Effects: Menulis tabel branches.
*/

import type { IBranchRepository } from '../../../domain/repositories/branch.repository'
import { AppError } from '../../../shared/errors/app.error'

export interface CreateBranchInput {
  name: string
  code: string
  address: string | null
  city: string | null
  phone: string | null
  isActive: boolean
}

export class CreateBranchUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(input: CreateBranchInput) {
    const existing = await this.branchRepository.findActive() // we can also write a check for unique code if findActive contains all, but branch.code is UNIQUE in postgres so let's try-catch or query
    const match = existing.find(b => b.code.toUpperCase() === input.code.toUpperCase())
    if (match) {
      throw new AppError('Kode cabang sudah digunakan', 409, 'BRANCH_CODE_EXISTS')
    }

    const branch = await this.branchRepository.create({
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      address: input.address ? input.address.trim() : null,
      city: input.city ? input.city.trim() : null,
      phone: input.phone ? input.phone.trim() : null,
      isActive: input.isActive
    })

    return {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      isActive: branch.isActive
    }
  }
}
