/*
Tujuan: Menyediakan mapper domain ujian fase 4 dari row database ke entitas ExamEntity.
Caller: Exam repository implementation.
Dependensi: ExamEntity domain.
Main Functions: Mengubah row tabel exams menjadi entitas domain yang konsisten dipakai use case.
Side Effects: Tidak ada; hanya transformasi data in-memory.
*/

import { ExamEntity } from '../../domain/entities/exam.entity'

export class ExamMapper {
  static toDomain(row: {
    id: string
    branchId: string | null
    subjectId: string | null
    createdBy: string | null
    title: string
    slug: string
    description: string | null
    instructions: string | null
    examType: 'TRYOUT' | 'LATIHAN' | 'MID_EXAM' | 'FINAL_EXAM'
    durationMinutes: number
    totalQuestions: number
    totalScore: number
    startsAt: Date
    endsAt: Date
    isPublished: boolean
  }): ExamEntity {
    return new ExamEntity(
      row.id,
      row.branchId,
      row.subjectId,
      row.createdBy,
      row.title,
      row.slug,
      row.description,
      row.instructions,
      row.examType,
      row.durationMinutes,
      row.totalQuestions,
      row.totalScore,
      row.startsAt,
      row.endsAt,
      row.isPublished
    )
  }
}

