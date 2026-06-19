/*
Tujuan: Menyediakan use case fase 6 untuk mengambil data monitor live peserta ujian bagi guru.
Caller: Proctor controller (guru).
Dependensi: Proctor repository, exam repository, dan app error.
Main Functions: Memvalidasi ujian dan mengambil status realtime pengerjaan murid (warning count, heartbeat, status).
Side Effects: Membaca data exam_sessions dari PostgreSQL.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IProctorRepository, LiveProctorParticipant } from '../../../domain/repositories/proctor.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export interface GetLiveProctorDataInput {
  examId: string
}

export class GetLiveProctorDataUseCase {
  constructor(
    private readonly proctorRepository: IProctorRepository,
    private readonly examRepository: IExamRepository
  ) {}

  async execute(input: GetLiveProctorDataInput): Promise<LiveProctorParticipant[]> {
    const exam = await this.examRepository.findById(input.examId)

    if (!exam) {
      throw new NotFoundError('Ujian')
    }

    return this.proctorRepository.getLiveProctorData(input.examId)
  }
}
