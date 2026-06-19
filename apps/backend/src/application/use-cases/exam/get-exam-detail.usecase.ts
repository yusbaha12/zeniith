/*
Tujuan: Menyediakan use case fase 4 untuk detail ujian sebelum murid memulai sesi.
Caller: Exam controller student.
Dependensi: Exam repository.
Main Functions: Mengambil metadata dan aturan ujian yang masih bisa dilihat murid.
Side Effects: Membaca tabel exams dan subjects.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export class GetExamDetailUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(examId: string) {
    const exam = await this.examRepository.findDetailById(examId)

    if (!exam) {
      throw new NotFoundError('Ujian')
    }

    return exam
  }
}

