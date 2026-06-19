/*
Tujuan: Menyediakan use case fase 4 untuk memulai sesi ujian murid.
Caller: Exam controller student.
Dependensi: Exam repository, exam service, dan exam processing queue.
Main Functions: Memvalidasi eligibility ujian, mencegah duplikasi sesi, membuat sesi baru, dan menjadwalkan auto-submit.
Side Effects: Membaca tabel exams/sessions, menulis exam_sessions, dan dapat menambah delayed job BullMQ.
*/

import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { ExamQuestion } from '../../../domain/entities/exam.entity'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamService } from '../../services/exam.service'
import { ExamProcessingQueue } from '../../../infrastructure/queues/exam-processing.queue'

const toStudentQuestions = (questions: ExamQuestion[]) =>
  questions.map((question) => ({
    id: question.id,
    questionType: question.questionType,
    contentJson: question.contentJson,
    score: question.score,
    sortOrder: question.sortOrder,
    options: question.options.map((option) => ({
      id: option.id,
      optionKey: option.optionKey,
      contentJson: option.contentJson,
      sortOrder: option.sortOrder
    }))
  }))

export class StartExamUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examService: ExamService,
    private readonly examProcessingQueue: ExamProcessingQueue
  ) {}

  async execute(examId: string, userId: string) {
    const now = new Date()
    const examBundle = await this.examRepository.findWithQuestions(examId)

    if (!examBundle) {
      throw new NotFoundError('Ujian')
    }

    if (!examBundle.exam.isAvailable(now)) {
      throw new ForbiddenError('Ujian belum atau sudah tidak tersedia')
    }

    if (examBundle.questions.length === 0) {
      throw new ConflictError('Ujian belum memiliki soal')
    }

    const activeSession = await this.examRepository.findActiveSession(examId, userId)
    if (activeSession) {
      return {
        session: activeSession,
        exam: examBundle.exam.toSummary(),
        questions: toStudentQuestions(examBundle.questions)
      }
    }

    const latestSession = await this.examRepository.findLatestSession(examId, userId)
    if (latestSession && latestSession.status !== 'ACTIVE') {
      throw new ConflictError('Ujian ini sudah pernah Anda kerjakan')
    }

    const startedAt = now
    const expiresAt = new Date(Math.min(
      examBundle.exam.endsAt.getTime(),
      startedAt.getTime() + (examBundle.exam.durationMinutes * 60_000)
    ))

    const session = await this.examRepository.createSession({
      examId,
      userId,
      startedAt,
      expiresAt
    })

    try {
      await this.examProcessingQueue.scheduleAutoSubmit(
        session.id,
        Math.max(1_000, expiresAt.getTime() - Date.now())
      )
    } catch {
      // fallback on-demand auto submit tetap ditangani saat sesi diakses setelah expiry
    }

    return {
      session,
      exam: examBundle.exam.toSummary(),
      questions: toStudentQuestions(examBundle.questions)
    }
  }
}
