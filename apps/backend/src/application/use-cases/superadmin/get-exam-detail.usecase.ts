import { NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export class SuperadminGetExamDetailUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(examId: string) {
    const examBundle = await this.examRepository.findWithQuestions(examId)
    if (!examBundle) {
      throw new NotFoundError('Ujian tidak ditemukan')
    }

    const examDetail = await this.examRepository.findDetailById(examId)

    return {
      exam: examDetail ?? examBundle.exam,
      questions: examBundle.questions
    }
  }
}
