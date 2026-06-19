/*
Tujuan: Menyediakan use case fase 7 untuk mengupdate data paket.
Caller: Super admin controller.
Dependensi: IPackageRepository.
Main Functions: Memperbarui data paket di database.
Side Effects: Menulis tabel packages.
*/

import type { IPackageRepository } from '../../../domain/repositories/package.repository'
import { AppError } from '../../../shared/errors/app.error'

export interface UpdatePackageInput {
  id: string
  name?: string
  type?: 'REGULER' | 'INTENSIF' | 'PREMIUM'
  description?: string | null
  price?: number
  durationDays?: number
  isActive?: boolean
  sortOrder?: number
}

export class UpdatePackageUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(input: UpdatePackageInput) {
    const pkg = await this.packageRepository.findById(input.id)
    if (!pkg) {
      throw new AppError('Paket tidak ditemukan', 404, 'PACKAGE_NOT_FOUND')
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.type !== undefined) updateData.type = input.type
    if (input.description !== undefined) updateData.description = input.description ? input.description.trim() : null
    if (input.price !== undefined) updateData.price = input.price
    if (input.durationDays !== undefined) updateData.durationDays = input.durationDays
    if (input.isActive !== undefined) updateData.isActive = input.isActive
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder

    const updated = await this.packageRepository.update(input.id, updateData)

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      description: updated.description,
      price: updated.price,
      durationDays: updated.durationDays,
      isActive: updated.isActive,
      sortOrder: updated.sortOrder
    }
  }
}
