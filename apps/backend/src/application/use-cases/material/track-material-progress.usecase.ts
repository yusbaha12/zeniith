/*
Tujuan: Menyediakan use case track progress materi fase 3 untuk murid sekaligus reward XP gamifikasi saat materi selesai.
Caller: Material controller student.
Dependensi: AppDatabase, IMaterialRepository, dan GamificationService.
Main Functions: Menormalisasi progres 0-100, upsert progress per user-material, dan memberi XP idempotent untuk materi selesai.
Side Effects: Menulis tabel material_progresses, student_profiles, dan xp_ledger pada PostgreSQL dalam transaksi.
*/

import type { GamificationService } from '../../services/gamification.service'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import type { AppDatabase } from '../../../infrastructure/database/connection'

export class TrackMaterialProgressUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly materialRepository: IMaterialRepository,
    private readonly gamificationService: GamificationService
  ) {}

  async execute(userId: string, materialId: string, progressPercent: number, isCompleted: boolean) {
    const normalizedProgress = isCompleted ? 100 : Math.max(0, Math.min(100, progressPercent))
    let gamificationReward: Awaited<ReturnType<GamificationService['awardMaterialCompleted']>> | null = null

    await this.database.transaction(async (transaction) => {
      await this.materialRepository.upsertProgress({
        userId,
        materialId,
        progressPercent: normalizedProgress,
        isCompleted
      }, transaction)

      if (isCompleted) {
        gamificationReward = await this.gamificationService.awardMaterialCompleted(userId, materialId, transaction)
      }
    })

    return {
      materialId,
      progressPercent: normalizedProgress,
      isCompleted,
      gamificationReward
    }
  }
}
