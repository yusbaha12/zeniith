/*
Tujuan: Menyediakan use case fase 4 untuk daftar ujian milik guru.
Caller: Teacher exam controller.
Dependensi: Exam repository.
Main Functions: Mengambil daftar ujian yang dibuat guru beserta statistik peserta.
Side Effects: Membaca tabel exams, subjects, dan exam_sessions.
*/

import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export class ListTeacherExamsUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(teacherId: string, branchId: string | null) {
    return this.examRepository.listByTeacher(teacherId, branchId)
  }
}

