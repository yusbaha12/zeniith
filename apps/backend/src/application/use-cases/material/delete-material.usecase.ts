/*
Tujuan: Menyediakan use case delete materi guru fase 3 dengan kontrol PIC guru.
Caller: Teacher material controller.
Dependensi: DB transaction, material repository, dan module repository.
Main Functions: Memastikan kepemilikan materi dan akses PIC lalu menghapus record materi.
Side Effects: Menghapus tabel materials dan progress terkait via cascade PostgreSQL.
*/

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import type { IModuleRepository } from '../../../domain/repositories/module.repository'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'

export class DeleteMaterialUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly materialRepository: IMaterialRepository,
    private readonly moduleRepository: IModuleRepository
  ) {}

  async execute(materialId: string, teacherId: string) {
    const currentMaterial = await this.materialRepository.findById(materialId)

    if (!currentMaterial) {
      throw new NotFoundError('Materi belajar')
    }

    if (currentMaterial.createdBy !== teacherId) {
      throw new ForbiddenError('Materi ini bukan milik Anda')
    }

    const moduleItem = await this.moduleRepository.findModuleById(currentMaterial.moduleId)

    if (!moduleItem) {
      throw new NotFoundError('Modul belajar')
    }

    const canAccessSubject = await this.moduleRepository.teacherCanAccessSubject(moduleItem.subjectId, teacherId)

    if (!canAccessSubject) {
      throw new ForbiddenError('Anda bukan PIC guru untuk mata pelajaran ini')
    }

    await this.database.transaction(async (transaction) => {
      await this.materialRepository.delete(materialId, transaction)
    })

    return {
      id: materialId
    }
  }
}
