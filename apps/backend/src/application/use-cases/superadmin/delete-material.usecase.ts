/*
Tujuan: Menyediakan use case hapus materi global untuk Superadmin.
Caller: SuperAdminController endpoint `DELETE /api/superadmin/materials/:id`.
Dependensi: DB transaction dan material repository.
Main Functions: Memastikan materi ada lalu menghapus record lintas pemilik secara atomik.
Side Effects: Menghapus tabel materials dan progress terkait via cascade PostgreSQL.
*/

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import { NotFoundError } from '../../../shared/errors/app.error'

export class SuperadminDeleteMaterialUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly materialRepository: IMaterialRepository
  ) {}

  async execute(materialId: string) {
    const currentMaterial = await this.materialRepository.findById(materialId)

    if (!currentMaterial) {
      throw new NotFoundError('Materi belajar')
    }

    await this.database.transaction(async (transaction) => {
      await this.materialRepository.delete(materialId, transaction)
    })

    return {
      id: materialId
    }
  }
}
