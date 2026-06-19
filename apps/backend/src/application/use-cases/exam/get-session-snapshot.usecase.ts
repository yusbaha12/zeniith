/*
Tujuan: Menyediakan use case fase 4 untuk snapshot ruang ujian murid yang sedang berjalan.
Caller: Exam controller student.
Dependensi: Exam repository dan exam processing queue.
Main Functions: Mengambil sesi, soal tersanitasi, dan jawaban terakhir murid untuk resume ruang ujian.
Side Effects: Membaca tabel exam_sessions, exams, questions, options, dan answers; dapat memicu auto-submit fallback bila sesi kadaluarsa.
*/

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamProcessingQueue } from '../../../infrastructure/queues/exam-processing.queue'

const toStudentQuestions = (questions: any[]) =>
  questions.map((question) => ({
    id: question.id,
    questionType: question.questionType,
    contentJson: question.contentJson,
    score: question.score,
    sortOrder: question.sortOrder,
    options: question.options.map((option: any) => ({
      id: option.id,
      optionKey: option.optionKey,
      contentJson: option.contentJson,
      sortOrder: option.sortOrder
    }))
  }))

export class GetSessionSnapshotUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examProcessingQueue: ExamProcessingQueue
  ) {}

  async execute(sessionId: string, userId: string) {
    let session = await this.examRepository.findSessionById(sessionId)

    if (!session) {
      throw new NotFoundError('Sesi ujian')
    }

    if (session.userId !== userId) {
      throw new ForbiddenError()
    }

    if (session.status === 'ACTIVE' && session.expiresAt.getTime() <= Date.now()) {
      await this.examProcessingQueue.processSubmitNow(session.id, true)
      session = await this.examRepository.findSessionById(sessionId)
    }

    const examBundle = await this.examRepository.findWithQuestions(session!.examId)
    if (!examBundle) {
      throw new NotFoundError('Ujian')
    }

    const answers = await this.examRepository.listAnswerSnapshots(sessionId)

    return {
      session,
      exam: examBundle.exam.toSummary(),
      questions: toStudentQuestions(examBundle.questions),
      answers
    }
  }
}

