import type { QuestionType } from '@lms-bimbel/shared'
import { NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamService } from '../../services/exam.service'

interface UpdateQuestionInput {
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

export class SuperadminUpdateQuestionUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examService: ExamService
  ) {}

  async execute(input: UpdateQuestionInput) {
    const question = await this.examRepository.findQuestionById(input.questionId)
    if (!question) {
      throw new NotFoundError('Soal tidak ditemukan')
    }

    this.examService.validateQuestion(input.questionType, input.options)

    const updated = await this.examRepository.updateQuestion(input.questionId, {
      questionType: input.questionType,
      contentJson: input.contentJson,
      explanationJson: input.explanationJson,
      score: input.score,
      sortOrder: input.sortOrder,
      options: input.options
    })

    await this.examRepository.recalculateExamStats(question.examId)

    return updated
  }
}
