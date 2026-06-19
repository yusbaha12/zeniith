/*
Tujuan: Menyediakan use case fase 4 untuk mengubah soal ujian milik guru.
Caller: Teacher exam controller.
Dependensi: Exam repository dan exam service.
Main Functions: Memastikan soal milik ujian guru, memvalidasi opsi baru, lalu memperbarui soal dan agregat exam.
Side Effects: Menulis tabel questions/options dan mengubah agregat total soal/score di exams.
*/

import type { QuestionType } from '@lms-bimbel/shared'

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamService } from '../../services/exam.service'

interface UpdateQuestionInput {
  teacherId: string
  questionId: string
  questionType: QuestionType
  contentJson: Record<string, unknown>
  explanationJson: Record<string, unknown> | null
  score: number
  sortOrder: number
  options: Array<{
    id?: string
    optionKey: string
    contentJson: Record<string, unknown>
    isCorrect: boolean
    sortOrder: number
  }>
}

export class UpdateQuestionUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examService: ExamService
  ) {}

  async execute(input: UpdateQuestionInput) {
    const question = await this.examRepository.findQuestionById(input.questionId)
    if (!question) {
      throw new NotFoundError('Soal ujian')
    }

    const exam = await this.examRepository.findTeacherExamById(question.examId, input.teacherId)
    if (!exam) {
      throw new ForbiddenError('Soal ujian tidak tersedia untuk guru ini')
    }

    this.examService.validateQuestion(input.questionType, input.options)

    const updatedQuestion = await this.examRepository.updateQuestion(input.questionId, {
      questionType: input.questionType,
      contentJson: input.contentJson,
      explanationJson: input.explanationJson,
      score: input.score,
      sortOrder: input.sortOrder,
      options: input.options
    })

    await this.examRepository.recalculateExamStats(question.examId)

    return updatedQuestion
  }
}
