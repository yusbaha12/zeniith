/*
Tujuan: Menyediakan use case fase 5 untuk mengambil snapshot leaderboard ujian murid.
Caller: Exam controller student dan halaman leaderboard frontend.
Dependensi: Repository ujian dan LeaderboardService.
Main Functions: Memastikan ujian ada lalu mengembalikan snapshot leaderboard beserta rank murid saat tersedia.
Side Effects: Membaca data ujian, hasil leaderboard, dan cache Redis via service bila tersedia.
*/

import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { NotFoundError } from '../../../shared/errors/app.error'
import { LeaderboardService } from '../../services/leaderboard.service'

export class GetExamLeaderboardUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly leaderboardService: LeaderboardService
  ) {}

  async execute(examId: string, userId: string) {
    const exam = await this.examRepository.findById(examId)

    if (!exam) {
      throw new NotFoundError('Ujian')
    }

    return this.leaderboardService.buildSnapshotForUser(examId, userId)
  }
}
