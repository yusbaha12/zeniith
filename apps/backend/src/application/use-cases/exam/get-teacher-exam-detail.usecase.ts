/*
Tujuan: Menyediakan use case fase 4 untuk detail ujian dan soal milik guru.
Caller: Teacher exam controller.
Dependensi: Exam repository.
Main Functions: Memuat metadata ujian dan seluruh soal untuk kebutuhan edit/preview guru.
Side Effects: Membaca tabel exams, questions, dan options.
*/

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export class GetTeacherExamDetailUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(examId: string, teacherId: string) {
    const exam = await this.examRepository.findTeacherExamById(examId, teacherId)
    if (!exam) {
      throw new ForbiddenError('Ujian tidak tersedia untuk guru ini')
    }

    const examBundle = await this.examRepository.findWithQuestions(examId)
    if (!examBundle) {
      throw new NotFoundError('Ujian')
    }

    return {
      exam,
      questions: examBundle.questions
    }
  }
}

