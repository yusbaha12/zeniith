/*
Tujuan: Menyediakan use case daftar materi per modul fase 3 untuk murid, dengan pengecekan hak akses berdasarkan paket.
Caller: Material controller student.
Dependensi: IModuleRepository, IMaterialRepository, ISubscriptionRepository, IPackageRepository.
Main Functions: Mengambil materi published per modul; jika murid, validasi akses paket terhadap mata pelajaran modul.
Side Effects: Membaca tabel modules, materials, material_progresses, subscriptions, dan package_subjects.
*/

import { NotFoundError, ForbiddenError } from '../../../shared/errors/app.error'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import type { IModuleRepository } from '../../../domain/repositories/module.repository'
import type { ISubscriptionRepository } from '../../../domain/repositories/subscription.repository'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export class ListMaterialsByModuleUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly materialRepository: IMaterialRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly packageRepository: IPackageRepository
  ) {}

  async execute(moduleId: string, userId: string, userRole?: string) {
    const moduleItem = await this.moduleRepository.findModuleById(moduleId)

    if (!moduleItem) {
      throw new NotFoundError('Modul belajar')
    }

    // For students, validate they have an active subscription with access to this module's subject
    if (userRole === 'STUDENT' && userId) {
      const activeSub = await this.subscriptionRepository.findCurrentByUserId(userId)

      if (!activeSub || !activeSub.packageId) {
        throw new ForbiddenError('Anda tidak memiliki paket belajar aktif')
      }

      const allowedSubjectIds = await this.packageRepository.listSubjectsByPackageId(activeSub.packageId)

      if (allowedSubjectIds.length > 0) {
        if (!allowedSubjectIds.includes(moduleItem.subjectId)) {
          throw new ForbiddenError('Modul ini tidak tersedia dalam paket belajar Anda')
        }
      }
    }

    return {
      module: moduleItem.toSummary(),
      materials: await this.materialRepository.listByModuleId(moduleId, userId)
    }
  }
}
