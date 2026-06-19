/*
Tujuan: Menyediakan use case fase 7 untuk menambahkan fitur baru pada suatu paket.
Caller: Super admin controller.
Dependensi: IPackageRepository, NotFoundError.
Main Functions: Menyimpan data fitur baru terikat pada packageId.
Side Effects: Menulis tabel package_features.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export interface CreatePackageFeatureInput {
  packageId: string
  title: string
  description: string | null
  sortOrder: number
}

export class CreatePackageFeatureUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(input: CreatePackageFeatureInput) {
    const pkg = await this.packageRepository.findById(input.packageId)
    if (!pkg) {
      throw new NotFoundError('Paket belajar')
    }

    const feature = await this.packageRepository.createFeature({
      packageId: input.packageId,
      title: input.title.trim(),
      description: input.description ? input.description.trim() : null,
      sortOrder: input.sortOrder
    })

    return feature
  }
}
