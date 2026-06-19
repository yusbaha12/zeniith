/*
Tujuan: Menyediakan use case fase 7 untuk membuat paket baru.
Caller: Super admin controller.
Dependensi: IPackageRepository.
Main Functions: Menyimpan data paket baru ke database.
Side Effects: Menulis tabel packages.
*/

import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export interface CreatePackageInput {
  name: string
  type: 'REGULER' | 'INTENSIF' | 'PREMIUM'
  description: string | null
  price: number
  durationDays: number
  isActive: boolean
  sortOrder: number
}

export class CreatePackageUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(input: CreatePackageInput) {
    const pkg = await this.packageRepository.create({
      name: input.name.trim(),
      type: input.type,
      description: input.description ? input.description.trim() : null,
      price: input.price,
      durationDays: input.durationDays,
      isActive: input.isActive,
      sortOrder: input.sortOrder
    })

    return {
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      description: pkg.description,
      price: pkg.price,
      durationDays: pkg.durationDays,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder
    }
  }
}
