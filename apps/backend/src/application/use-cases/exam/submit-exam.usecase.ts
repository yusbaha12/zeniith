/*
Tujuan: Menyediakan use case fase 4 untuk final submit sesi ujian murid.
Caller: Exam controller student.
Dependensi: Exam repository dan exam processing queue.
Main Functions: Memvalidasi kepemilikan sesi lalu enqueue atau fallback grading akhir sesi.
Side Effects: Membaca exam_sessions dan menulis status sesi/hasil ujian.
*/

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamProcessingQueue } from '../../../infrastructure/queues/exam-processing.queue'

export class SubmitExamUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examProcessingQueue: ExamProcessingQueue
  ) {}

  async execute(sessionId: string, userId: string) {
    const session = await this.examRepository.findSessionById(sessionId)

    if (!session) {
      throw new NotFoundError('Sesi ujian')
    }

    if (session.userId !== userId) {
      throw new ForbiddenError()
    }

    const queued = await this.examProcessingQueue.enqueueSubmit(session.id, false)
    if (!queued) {
      await this.examProcessingQueue.processSubmitNow(session.id, false)
    }

    return {
      sessionId: session.id,
      status: 'SUBMITTED'
    }
  }
}

