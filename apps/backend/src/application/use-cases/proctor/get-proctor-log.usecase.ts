/*
Tujuan: Menyediakan use case fase 6 untuk mengambil riwayat log kecurangan per murid.
Caller: Proctor controller (guru).
Dependensi: Proctor repository, exam repository, dan app error.
Main Functions: Memvalidasi sesi dan mengambil riwayat detail warning/tab switch murid.
Side Effects: Membaca tabel proctor_logs dari PostgreSQL.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IProctorRepository } from '../../../domain/repositories/proctor.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import type { ProctorLogEntity } from '../../../domain/entities/proctor.entity'

export interface GetProctorLogInput {
  sessionId: string
}

export class GetProctorLogUseCase {
  constructor(
    private readonly proctorRepository: IProctorRepository,
    private readonly examRepository: IExamRepository
  ) {}

  async execute(input: GetProctorLogInput): Promise<ProctorLogEntity[]> {
    const session = await this.examRepository.findSessionById(input.sessionId)

    if (!session) {
      throw new NotFoundError('Sesi ujian')
    }

    return this.proctorRepository.getLogsBySessionId(input.sessionId)
  }
}
