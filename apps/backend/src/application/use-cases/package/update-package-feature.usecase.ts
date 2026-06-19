/*
Tujuan: Menyediakan use case fase 7 untuk memperbarui rincian fitur paket.
Caller: Super admin controller.
Dependensi: IPackageRepository, NotFoundError.
Main Functions: Memperbarui field title, description, atau sortOrder dari fitur paket.
Side Effects: Menulis tabel package_features.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export interface UpdatePackageFeatureInput {
  id: string
  title?: string
  description?: string | null
  sortOrder?: number
}

export class UpdatePackageFeatureUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  async execute(input: UpdatePackageFeatureInput) {
    const existing = await this.packageRepository.findFeatureById(input.id)
    if (!existing) {
      throw new NotFoundError('Fitur paket')
    }

    const updated = await this.packageRepository.updateFeature(input.id, {
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
      sortOrder: input.sortOrder
    })

    return updated
  }
}
