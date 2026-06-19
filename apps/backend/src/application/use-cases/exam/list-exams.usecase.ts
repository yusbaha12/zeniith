/*
Tujuan: Menyediakan use case fase 4 untuk daftar ujian yang terlihat oleh murid.
Caller: Exam controller student.
Dependensi: Exam repository.
Main Functions: Mengambil daftar ujian published per cabang beserta status relatif waktu dan jejak sesi user.
Side Effects: Membaca tabel exams, exam_sessions, exam_results, dan subjects.
*/

import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export class ListExamsUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(userId: string, branchId: string | null) {
    return this.examRepository.listAvailableExams(userId, branchId, new Date())
  }
}

