/*
Tujuan: Menyediakan use case fase 5 untuk melihat hasil ujian, review jawaban, dan snapshot leaderboard awal.
Caller: Exam controller student dan halaman hasil frontend.
Dependensi: Exam repository, exam processing queue, dan LeaderboardService.
Main Functions: Memastikan sesi milik murid, memicu fallback grading bila perlu, lalu mengembalikan agregat hasil, review soal, dan leaderboard awal.
Side Effects: Membaca sesi/hasil/soal/jawaban, membaca snapshot leaderboard, dan dapat menulis hasil ujian saat queue belum memproses.
*/

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamProcessingQueue } from '../../../infrastructure/queues/exam-processing.queue'
import { LeaderboardService } from '../../services/leaderboard.service'

export class GetExamResultUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examProcessingQueue: ExamProcessingQueue,
    private readonly leaderboardService: LeaderboardService
  ) {}

  async execute(sessionId: string, userId: string) {
    const session = await this.examRepository.findSessionById(sessionId)

    if (!session) {
      throw new NotFoundError('Sesi ujian')
    }

    if (session.userId !== userId) {
      throw new ForbiddenError()
    }

    if (session.status === 'ACTIVE' && session.expiresAt.getTime() <= Date.now()) {
      await this.examProcessingQueue.processSubmitNow(session.id, true)
    }

    let result = await this.examRepository.findResultBySessionId(session.id)

    if (!result) {
      await this.examProcessingQueue.processSubmitNow(session.id, session.status === 'ACTIVE')
      result = await this.examRepository.findResultBySessionId(session.id)
    }

    if (!result) {
      throw new NotFoundError('Hasil ujian')
    }

    const examBundle = await this.examRepository.findWithQuestions(session.examId)
    if (!examBundle) {
      throw new NotFoundError('Ujian')
    }

    const answers = await this.examRepository.listAnswerSnapshots(session.id)
    const answersByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]))

    return {
      result,
      exam: examBundle.exam.toSummary(),
      leaderboard: await this.leaderboardService.buildSnapshot(session.examId, session.id),
      review: examBundle.questions.map((question) => {
        const answer = answersByQuestionId.get(question.id)
        const correctOption = question.options.find((option) => option.isCorrect)

        return {
          id: question.id,
          questionType: question.questionType,
          contentJson: question.contentJson,
          explanationJson: question.explanationJson,
          score: question.score,
          selectedOptionId: answer?.selectedOptionId ?? null,
          answerText: answer?.answerText ?? null,
          correctOptionId: correctOption?.id ?? null,
          options: question.options.map((option) => ({
            id: option.id,
            optionKey: option.optionKey,
            contentJson: option.contentJson,
            isCorrect: option.isCorrect
          }))
        }
      })
    }
  }
}
