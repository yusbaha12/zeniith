/*
Tujuan: Menyediakan use case fase 6 untuk mengirimkan peringatan kecurangan kepada murid secara manual oleh guru.
Caller: Proctor controller (guru).
Dependensi: Proctor repository, exam repository, dan app error.
Main Functions: Menyimpan peringatan manual dari guru, menaikkan warning count, dan menghentikan sesi jika melebihi batas.
Side Effects: Menulis proctor_warnings dan mengubah status exam_sessions jika di-terminate.
*/

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IProctorRepository } from '../../../domain/repositories/proctor.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export interface WarnStudentInput {
  sessionId: string
  userId: string
  message: string
}

export interface WarnStudentOutput {
  terminated: boolean
  warningCount: number
}

export class WarnStudentUseCase {
  constructor(
    private readonly proctorRepository: IProctorRepository,
    private readonly examRepository: IExamRepository,
    private readonly onWarningIssued?: (
      sessionId: string,
      userId: string,
      message: string,
      warningCount: number,
      terminated: boolean
    ) => Promise<void>
  ) {}

  async execute(input: WarnStudentInput): Promise<WarnStudentOutput> {
    const session = await this.examRepository.findSessionById(input.sessionId)

    if (!session) {
      throw new NotFoundError('Sesi ujian')
    }

    if (session.userId !== input.userId) {
      throw new ForbiddenError('Sesi ujian tidak sesuai dengan pengguna')
    }

    if (session.status !== 'ACTIVE') {
      return {
        terminated: session.status === 'TERMINATED',
        warningCount: session.warningCount
      }
    }

    // 1. Naikkan warning count di database
    const currentWarningCount = await this.proctorRepository.incrementSessionWarningCount(input.sessionId)

    // 2. Simpan record warning
    await this.proctorRepository.saveWarning({
      sessionId: input.sessionId,
      userId: input.userId,
      warningCount: currentWarningCount,
      message: input.message
    })

    // 3. Batas warning maksimal sebelum terminasi otomatis
    const MAX_WARNINGS = 5
    const terminated = currentWarningCount >= MAX_WARNINGS

    if (terminated) {
      await this.examRepository.updateSessionStatus(
        input.sessionId,
        'TERMINATED',
        new Date(),
        true
      )
    }

    if (this.onWarningIssued) {
      await this.onWarningIssued(
        input.sessionId,
        input.userId,
        input.message,
        currentWarningCount,
        terminated
      )
    }

    return {
      terminated,
      warningCount: currentWarningCount
    }
  }
}
