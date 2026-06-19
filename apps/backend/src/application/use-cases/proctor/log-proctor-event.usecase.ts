/*
Tujuan: Menyediakan use case fase 6 untuk mencatat log kecurangan dari WebSocket client.
Caller: WS Handler Proctor.
Dependensi: Proctor repository, exam repository, dan enum shared.
Main Functions: Menyimpan log kecurangan, menaikkan warning count jika tab switch/blur, dan menghentikan sesi jika melebihi batas.
Side Effects: Menulis proctor_logs dan mengubah status exam_sessions jika di-terminate.
*/

import type { ProctorEventType } from '@lms-bimbel/shared'

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IProctorRepository } from '../../../domain/repositories/proctor.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export interface LogProctorEventInput {
  sessionId: string
  userId: string
  eventType: ProctorEventType
  metadata: Record<string, unknown>
}

export interface LogProctorEventOutput {
  terminated: boolean
  warningCount: number
}

export class LogProctorEventUseCase {
  constructor(
    private readonly proctorRepository: IProctorRepository,
    private readonly examRepository: IExamRepository
  ) {}

  async execute(input: LogProctorEventInput): Promise<LogProctorEventOutput> {
    const session = await this.examRepository.findSessionById(input.sessionId)

    if (!session) {
      throw new NotFoundError('Sesi ujian')
    }

    if (session.userId !== input.userId) {
      throw new ForbiddenError('Anda tidak memiliki akses ke sesi ini')
    }

    if (session.status !== 'ACTIVE') {
      return {
        terminated: session.status === 'TERMINATED',
        warningCount: session.warningCount
      }
    }

    // 1. Simpan log proctoring
    await this.proctorRepository.saveLog({
      sessionId: input.sessionId,
      userId: input.userId,
      eventType: input.eventType,
      metadata: input.metadata
    })

    // 2. Jika event tipe adalah TAB_SWITCH atau WINDOW_BLUR, naikkan warning count
    let currentWarningCount = session.warningCount
    if (input.eventType === 'TAB_SWITCH' || input.eventType === 'WINDOW_BLUR') {
      currentWarningCount = await this.proctorRepository.incrementSessionWarningCount(input.sessionId)

      // Simpan warning record
      await this.proctorRepository.saveWarning({
        sessionId: input.sessionId,
        userId: input.userId,
        warningCount: currentWarningCount,
        message: `Kecurangan terdeteksi: ${input.eventType}`
      })
    }

    // Batas warning maksimal sebelum terminasi otomatis
    const MAX_WARNINGS = 5

    if (currentWarningCount >= MAX_WARNINGS) {
      // Ubah status sesi ke TERMINATED
      await this.examRepository.updateSessionStatus(
        input.sessionId,
        'TERMINATED',
        new Date(),
        true // Dianggap auto submit karena di-terminate sistem
      )

      return {
        terminated: true,
        warningCount: currentWarningCount
      }
    }

    return {
      terminated: false,
      warningCount: currentWarningCount
    }
  }
}
