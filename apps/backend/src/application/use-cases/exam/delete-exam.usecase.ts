/*
Tujuan: Menyediakan use case untuk menghapus ujian.
Caller: Superadmin controller.
Dependensi: Exam repository.
Main Functions: Memverifikasi peran SUPERADMIN dan memicu penghapusan ujian beserta relasinya (cascade).
Side Effects: Menghapus record pada tabel exams di database.
*/

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'

interface DeleteExamInput {
  examId: string
  userId: string
  role: 'SUPERADMIN' | 'TEACHER'
}

export class DeleteExamUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(input: DeleteExamInput) {
    if (input.role !== 'SUPERADMIN') {
      throw new ForbiddenError('Hanya superadmin yang memiliki akses untuk menghapus ujian')
    }

    const exam = await this.examRepository.findById(input.examId)
    if (!exam) {
      throw new NotFoundError('Ujian')
    }

    await this.examRepository.deleteExam(input.examId)
  }
}
