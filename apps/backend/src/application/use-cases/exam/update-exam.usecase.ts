/*
Tujuan: Menyediakan use case untuk memperbarui metadata ujian oleh guru atau superadmin.
Caller: Teacher exam controller, Superadmin controller.
Dependensi: Exam repository dan exam service.
Main Functions: Memverifikasi hak akses (TEACHER hanya bisa edit buatannya sendiri), memvalidasi jadwal, dan menyimpan perubahan metadata ujian.
Side Effects: Memperbarui database tabel exams.
*/

import type { ExamType } from '@lms-bimbel/shared'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamService } from '../../services/exam.service'

interface UpdateExamInput {
  examId: string
  userId: string
  role: 'TEACHER' | 'SUPERADMIN'
  branchId: string | null
  subjectId: string | null
  title: string
  description: string | null
  instructions: string | null
  examType: ExamType
  durationMinutes: number
  startsAt: Date
  endsAt: Date
  isPublished: boolean
}

export class UpdateExamUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examService: ExamService
  ) {}

  async execute(input: UpdateExamInput) {
    const exam = await this.examRepository.findById(input.examId)
    if (!exam) {
      throw new NotFoundError('Ujian')
    }

    if (input.role === 'TEACHER' && exam.createdBy !== input.userId) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk mengubah ujian ini')
    }

    this.examService.validateSchedule(input.startsAt, input.endsAt, input.durationMinutes)

    const updated = await this.examRepository.updateExam(input.examId, {
      branchId: input.role === 'SUPERADMIN' ? input.branchId : exam.branchId,
      subjectId: input.subjectId,
      title: input.title,
      slug: this.examService.createSlug(input.title),
      description: input.description,
      instructions: input.instructions,
      examType: input.examType,
      durationMinutes: input.durationMinutes,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isPublished: input.isPublished
    })

    return updated.toSummary()
  }
}
