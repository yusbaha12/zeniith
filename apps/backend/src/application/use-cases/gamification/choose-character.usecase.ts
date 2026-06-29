/*
Tujuan: Mengganti karakter gamifikasi murid secara atomik.
Caller: Gamification controller endpoint `PATCH /api/gamification/me/character`.
Dependensi: AppDatabase, IGamificationRepository, dan GamificationService.
Main Functions: Memvalidasi kode karakter, memastikan profile ada, lalu update character_code dalam transaksi.
Side Effects: Menulis tabel student_profiles pada PostgreSQL.
*/

import type { GamificationCharacterCode } from '../../../domain/entities/gamification.entity'
import type { IGamificationRepository } from '../../../domain/repositories/gamification.repository'
import type { AppDatabase } from '../../../infrastructure/database/connection'
import { AppError } from '../../../shared/errors/app.error'
import type { GamificationService } from '../../services/gamification.service'

interface ChooseCharacterInput {
  studentId: string
  characterCode: string
}

export class ChooseCharacterUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly gamificationRepository: IGamificationRepository,
    private readonly gamificationService: GamificationService
  ) {}

  async execute(input: ChooseCharacterInput) {
    if (!this.gamificationService.isValidCharacter(input.characterCode)) {
      throw new AppError('Karakter gamifikasi tidak valid', 422, 'INVALID_GAMIFICATION_CHARACTER')
    }

    await this.database.transaction(async (transaction) => {
      const existingProfile = await this.gamificationRepository.findProfile(input.studentId, transaction)

      if (!existingProfile) {
        await this.gamificationRepository.createProfile(
          input.studentId,
          input.characterCode as GamificationCharacterCode,
          transaction
        )
      } else {
        await this.gamificationRepository.updateCharacter(
          input.studentId,
          input.characterCode as GamificationCharacterCode,
          transaction
        )
      }
    })

    return this.gamificationService.getStudentSnapshot(input.studentId)
  }
}
