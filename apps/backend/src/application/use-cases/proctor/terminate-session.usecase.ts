/*
Tujuan: Menyediakan use case fase 6 untuk menghentikan paksa sesi ujian murid secara administratif oleh guru.
Caller: Proctor controller (guru).
Dependensi: Exam repository dan app error.
Main Functions: Memvalidasi sesi aktif lalu mengubah status menjadi TERMINATED secara paksa.
Side Effects: Mengubah status exam_sessions di PostgreSQL.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export interface TerminateSessionInput {
  sessionId: string
}

export class TerminateSessionUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly onSessionTerminated?: (sessionId: string) => Promise<void>
  ) {}

  async execute(input: TerminateSessionInput): Promise<{ sessionId: string; status: string }> {
    const session = await this.examRepository.findSessionById(input.sessionId)

    if (!session) {
      throw new NotFoundError('Sesi ujian')
    }

    if (session.status !== 'ACTIVE') {
      return {
        sessionId: session.id,
        status: session.status
      }
    }

    await this.examRepository.updateSessionStatus(
      input.sessionId,
      'TERMINATED',
      new Date(),
      true // Tandai auto-submitted
    )

    if (this.onSessionTerminated) {
      await this.onSessionTerminated(input.sessionId)
    }

    return {
      sessionId: input.sessionId,
      status: 'TERMINATED'
    }
  }
}
