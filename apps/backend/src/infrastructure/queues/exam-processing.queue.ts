/*
Tujuan: Menyediakan queue dan worker BullMQ fase 5 untuk submit jawaban, grading hasil, auto-submit, dan sinkron leaderboard.
Caller: Container backend, bootstrap index, dan use case start/submit exam.
Dependensi: BullMQ, config backend, exam repository, exam service, dan logger.
Main Functions: Enqueue jawaban, schedule auto-submit, proses grading async, sinkronkan leaderboard setelah grading, serta fallback sinkron saat Redis tidak tersedia.
Side Effects: Membuka koneksi Redis, membuat job BullMQ, dan menulis data jawaban/hasil ke PostgreSQL.
*/

import { Queue, Worker } from 'bullmq'

import type { AppConfig } from '../../application/services/config.service'
import { ExamService } from '../../application/services/exam.service'
import type { IExamRepository } from '../../domain/repositories/exam.repository'
import { logger } from '../../shared/utils/logger.util'

interface SubmitAnswerJob {
  sessionId: string
  questionId: string
  selectedOptionId: string | null
  answerText: string | null
  isMarkedDoubt: boolean
}

interface SubmitSessionJob {
  sessionId: string
  isAutoSubmitted: boolean
}

export class ExamProcessingQueue {
  private worker: Worker | null = null
  private queue: Queue | null = null
  private started = false

  constructor(
    private readonly config: AppConfig,
    private readonly examRepository: IExamRepository,
    private readonly examService: ExamService,
    private readonly onResultSaved?: (sessionId: string, examId: string) => Promise<void>
  ) {}

  private getConnection() {
    const redisUrl = new URL(this.config.redisUrl)

    return {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || '6379'),
      username: redisUrl.username || undefined,
      password: redisUrl.password || undefined,
      maxRetriesPerRequest: null
    }
  }

  async start(): Promise<void> {
    if (this.started) {
      return
    }

    try {
      const connection = this.getConnection()
      this.queue = new Queue('exam-processing', { connection })
      this.worker = new Worker(
        'exam-processing',
        async (job) => {
          if (job.name === 'submit-answer') {
            await this.processAnswerNow(job.data as SubmitAnswerJob)
            return
          }

          if (job.name === 'submit-session') {
            await this.processSubmitNow((job.data as SubmitSessionJob).sessionId, (job.data as SubmitSessionJob).isAutoSubmitted)
          }
        },
        { connection }
      )

      this.started = true
    } catch (error) {
      logger.warn('Queue exam-processing tidak aktif karena Redis belum tersedia', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async enqueueAnswer(payload: SubmitAnswerJob): Promise<boolean> {
    if (!this.queue || !this.started) {
      return false
    }

    await this.queue.add('submit-answer', payload, {
      removeOnComplete: 500,
      removeOnFail: 500
    })

    return true
  }

  async enqueueSubmit(sessionId: string, isAutoSubmitted: boolean): Promise<boolean> {
    if (!this.queue || !this.started) {
      return false
    }

    await this.queue.add('submit-session', {
      sessionId,
      isAutoSubmitted
    } satisfies SubmitSessionJob, {
      jobId: `submit-session__${sessionId}__${isAutoSubmitted ? 'auto' : 'manual'}`,
      removeOnComplete: 500,
      removeOnFail: 500
    })

    return true
  }

  async scheduleAutoSubmit(sessionId: string, delayMs: number): Promise<boolean> {
    if (!this.queue || !this.started) {
      return false
    }

    await this.queue.add('submit-session', {
      sessionId,
      isAutoSubmitted: true
    } satisfies SubmitSessionJob, {
      delay: Math.max(delayMs, 1_000),
      jobId: `auto-submit__${sessionId}`,
      removeOnComplete: 500,
      removeOnFail: 500
    })

    return true
  }

  async processAnswerNow(payload: SubmitAnswerJob): Promise<void> {
    await this.examRepository.upsertAnswer(payload)
  }

  async processSubmitNow(sessionId: string, isAutoSubmitted: boolean): Promise<void> {
    const session = await this.examRepository.findSessionById(sessionId)

    if (!session) {
      return
    }

    const existingResult = await this.examRepository.findResultBySessionId(sessionId)
    if (existingResult && session.status !== 'ACTIVE') {
      return
    }

    const submittedAt = new Date()
    const finalizedSession = session.status === 'ACTIVE'
      ? await this.examRepository.updateSessionStatus(
        session.id,
        'SUBMITTED',
        submittedAt,
        isAutoSubmitted
      )
      : {
        ...session,
        submittedAt: session.submittedAt ?? submittedAt,
        isAutoSubmitted
      }

    const examBundle = await this.examRepository.findWithQuestions(finalizedSession.examId)
    if (!examBundle) {
      return
    }

    const answerSnapshots = await this.examRepository.listAnswerSnapshots(finalizedSession.id)
    const resultPayload = this.examService.computeResult(
      finalizedSession,
      examBundle.questions,
      answerSnapshots,
      new Date()
    )

    await this.examRepository.saveResult({
      sessionId: finalizedSession.id,
      examId: finalizedSession.examId,
      userId: finalizedSession.userId,
      ...resultPayload
    })

    await this.onResultSaved?.(finalizedSession.id, finalizedSession.examId)
  }
}
