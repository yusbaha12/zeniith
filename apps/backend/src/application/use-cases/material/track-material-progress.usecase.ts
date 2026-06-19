/*
Tujuan: Menyediakan use case track progress materi fase 3 untuk murid.
Caller: Material controller student.
Dependensi: IMaterialRepository.
Main Functions: Menormalisasi progres 0-100 lalu melakukan upsert progress per user-material.
Side Effects: Menulis tabel material_progresses pada PostgreSQL.
*/

import type { IMaterialRepository } from '../../../domain/repositories/material.repository'

export class TrackMaterialProgressUseCase {
  constructor(private readonly materialRepository: IMaterialRepository) {}

  async execute(userId: string, materialId: string, progressPercent: number, isCompleted: boolean) {
    const normalizedProgress = isCompleted ? 100 : Math.max(0, Math.min(100, progressPercent))

    await this.materialRepository.upsertProgress({
      userId,
      materialId,
      progressPercent: normalizedProgress,
      isCompleted
    })

    return {
      materialId,
      progressPercent: normalizedProgress,
      isCompleted
    }
  }
}
