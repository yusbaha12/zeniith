/*
Tujuan: Menyediakan use case fase 4 untuk membuat ujian baru oleh guru.
Caller: Teacher exam controller.
Dependensi: Exam repository dan exam service.
Main Functions: Memvalidasi jadwal ujian lalu menyimpan metadata exam baru.
Side Effects: Menulis tabel exams.
*/

import type { ExamType } from '@lms-bimbel/shared'

import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ExamService } from '../../services/exam.service'

interface CreateExamInput {
  teacherId: string
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

export class CreateExamUseCase {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly examService: ExamService
  ) {}

  async execute(input: CreateExamInput) {
    this.examService.validateSchedule(input.startsAt, input.endsAt, input.durationMinutes)

    const exam = await this.examRepository.createExam({
      branchId: input.branchId,
      subjectId: input.subjectId,
      createdBy: input.teacherId,
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

    return exam.toSummary()
  }
}

