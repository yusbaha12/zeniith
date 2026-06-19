/*
Tujuan: Menyediakan use case fase 4 untuk submit jawaban per soal secara idempoten.
Caller: Exam controller student dan room ujian frontend.
Dependensi: Exam repository, Redis client, dan exam processing queue.
Main Functions: Memvalidasi sesi/soal, mencegah submit duplikat lewat idempotency key, lalu enqueue atau fallback simpan jawaban.
Side Effects: Membaca sesi/soal, menulis jawaban ke PostgreSQL, dan dapat memakai Redis key TTL 60 detik.
*/

import type Redis from 'ioredis'

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamProcessingQueue } from '../../../infrastructure/queues/exam-processing.queue'

interface SubmitAnswerInput {
  questionId: string
  selectedOptionId?: string | null
  answerText?: string | null
  isMarkedDoubt?: boolean
  idempotencyKey: string
}

export class SubmitAnswerUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly getRedisClient: () => Redis,
    private readonly examProcessingQueue: ExamProcessingQueue
  ) {}

  async execute(sessionId: string, userId: string, input: SubmitAnswerInput) {
    const session = await this.examRepository.findSessionById(sessionId)

    if (!session) {
      throw new NotFoundError('Sesi ujian')
    }

    if (session.userId !== userId) {
      throw new ForbiddenError()
    }

    if (session.status !== 'ACTIVE' || session.expiresAt.getTime() <= Date.now()) {
      await this.examProcessingQueue.processSubmitNow(session.id, true)
      return {
        accepted: false,
        message: 'Waktu ujian telah habis dan sesi dikirim otomatis'
      }
    }

    const question = await this.examRepository.findQuestionById(input.questionId)
    if (!question || question.examId !== session.examId) {
      throw new NotFoundError('Soal ujian')
    }

    if (input.selectedOptionId && !question.options.some((option) => option.id === input.selectedOptionId)) {
      throw new NotFoundError('Opsi jawaban')
    }

    try {
      const redis = this.getRedisClient()
      const accepted = await redis.set(
        `exam-answer:${sessionId}:${input.questionId}:${input.idempotencyKey}`,
        '1',
        'PX',
        60_000,
        'NX'
      )

      if (accepted !== 'OK') {
        return {
          accepted: true,
          duplicate: true
        }
      }
    } catch {
      // fallback tanpa Redis tetap diizinkan
    }

    const payload = {
      sessionId,
      questionId: input.questionId,
      selectedOptionId: input.selectedOptionId ?? null,
      answerText: input.answerText ?? null,
      isMarkedDoubt: input.isMarkedDoubt ?? false
    }

    const queued = await this.examProcessingQueue.enqueueAnswer(payload)
    await this.examProcessingQueue.processAnswerNow(payload)

    return {
      accepted: true,
      duplicate: false,
      queued
    }
  }
}
