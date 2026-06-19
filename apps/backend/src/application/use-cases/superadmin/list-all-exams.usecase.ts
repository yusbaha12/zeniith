import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export class SuperadminListExamsUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute() {
    return this.examRepository.listAllExams()
  }
}
