/*
Tujuan: Menyediakan use case fase 4 untuk menambah soal pada ujian guru.
Caller: Teacher exam controller.
Dependensi: Exam repository dan exam service.
Main Functions: Memastikan guru memiliki ujian target, memvalidasi opsi jawaban, lalu membuat soal dan refresh statistik ujian.
Side Effects: Menulis tabel questions/options dan mengubah agregat total soal/score di exams.
*/

import type { QuestionType } from '@lms-bimbel/shared'

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamService } from '../../services/exam.service'

interface CreateQuestionInput {
  teacherId: string
  examId: string
  questionType: QuestionType
  contentJson: Record<string, unknown>
  explanationJson: Record<string, unknown> | null
  score: number
  sortOrder: number
  options: Array<{
    optionKey: string
    contentJson: Record<string, unknown>
    isCorrect: boolean
    sortOrder: number
  }>
}

export class CreateQuestionUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examService: ExamService
  ) {}

  async execute(input: CreateQuestionInput) {
    const exam = await this.examRepository.findTeacherExamById(input.examId, input.teacherId)
    if (!exam) {
      throw new ForbiddenError('Ujian tidak tersedia untuk guru ini')
    }

    this.examService.validateQuestion(input.questionType, input.options)

    const question = await this.examRepository.createQuestion({
      examId: input.examId,
      questionType: input.questionType,
      contentJson: input.contentJson,
      explanationJson: input.explanationJson,
      score: input.score,
      sortOrder: input.sortOrder,
      options: input.options
    })

    await this.examRepository.recalculateExamStats(input.examId)

    return question
  }
}

