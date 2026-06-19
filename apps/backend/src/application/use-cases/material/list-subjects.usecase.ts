/*
Tujuan: Menyediakan use case daftar mata pelajaran aktif fase 3, dengan filter berdasarkan paket langganan murid.
Caller: Material controller student dan teacher.
Dependensi: IModuleRepository, ISubscriptionRepository, IPackageRepository.
Main Functions: Mengambil daftar subject aktif; jika murid, hanya mengembalikan subjek yang ada di paket langganannya.
Side Effects: Membaca tabel subjects, subscriptions, dan package_subjects melalui repository.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'
import type { ISubscriptionRepository } from '../../../domain/repositories/subscription.repository'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'

export class ListSubjectsUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly packageRepository: IPackageRepository
  ) {}

  async execute(userId?: string, userRole?: string) {
    const allSubjects = await this.moduleRepository.listActiveSubjects()

    // If the user is a student, filter subjects by their active subscription's package
    if (userId && userRole === 'STUDENT') {
      const activeSub = await this.subscriptionRepository.findCurrentByUserId(userId)
      if (activeSub && activeSub.packageId) {
        const allowedSubjectIds = await this.packageRepository.listSubjectsByPackageId(activeSub.packageId)

        // If the package has explicit subject mappings, filter to only those
        if (allowedSubjectIds.length > 0) {
          const allowedSet = new Set(allowedSubjectIds)
          return allSubjects.filter((s) => allowedSet.has(s.id))
        }
      }
      // Student has no active subscription or package has no mappings — return empty list
      return []
    }

    // For teachers, admins, or unauthenticated (public preview), return all active subjects
    return allSubjects
  }
}
