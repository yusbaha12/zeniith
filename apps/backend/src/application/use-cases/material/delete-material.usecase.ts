/*
Tujuan: Menyediakan use case delete materi guru fase 3.
Caller: Teacher material controller.
Dependensi: DB transaction dan material repository.
Main Functions: Memastikan kepemilikan materi lalu menghapus record materi.
Side Effects: Menghapus tabel materials dan progress terkait via cascade PostgreSQL.
*/

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'

export class DeleteMaterialUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly materialRepository: IMaterialRepository
  ) {}

  async execute(materialId: string, teacherId: string) {
    const currentMaterial = await this.materialRepository.findById(materialId)

    if (!currentMaterial) {
      throw new NotFoundError('Materi belajar')
    }

    if (currentMaterial.createdBy !== teacherId) {
      throw new ForbiddenError('Materi ini bukan milik Anda')
    }

    await this.database.transaction(async (transaction) => {
      await this.materialRepository.delete(materialId, transaction)
    })

    return {
      id: materialId
    }
  }
}
