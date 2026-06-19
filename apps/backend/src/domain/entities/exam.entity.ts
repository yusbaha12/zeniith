/*
Tujuan: Merepresentasikan entitas ujian, soal, opsi, sesi, jawaban, dan hasil fase 4.
Caller: Exam repository, use case tryout, teacher CRUD ujian, dan grading worker.
Dependensi: Enum exam/session/question shared.
Main Functions: Menyimpan struktur domain ujian dan helper summary yang dibutuhkan student maupun teacher.
Side Effects: Tidak ada; entitas domain murni.
*/

import type { ExamType, QuestionType, SessionStatus } from '@lms-bimbel/shared'

export interface ExamSummary {
  id: string
  subjectId: string | null
  title: string
  slug: string
  description: string | null
  examType: ExamType
  durationMinutes: number
  totalQuestions: number
  totalScore: number
  startsAt: Date
  endsAt: Date
  isPublished: boolean
}

export interface ExamQuestionOption {
  id: string
  optionKey: string
  contentJson: Record<string, unknown>
  isCorrect: boolean
  sortOrder: number
}

export interface ExamQuestion {
  id: string
  examId: string
  questionType: QuestionType
  contentJson: Record<string, unknown>
  explanationJson: Record<string, unknown> | null
  score: number
  sortOrder: number
  options: ExamQuestionOption[]
}

export interface ExamSessionSummary {
  id: string
  examId: string
  userId: string
  status: SessionStatus
  warningCount: number
  isAutoSubmitted: boolean
  startedAt: Date
  expiresAt: Date
  submittedAt: Date | null
}

export interface ExamResultSummary {
  sessionId: string
  examId: string
  userId: string
  totalQuestions: number
  answeredQuestions: number
  correctAnswers: number
  wrongAnswers: number
  unansweredQuestions: number
  score: number
  maxScore: number
  percentage: number
  durationSeconds: number
  submittedAt: Date
  gradedAt: Date
}

export class ExamEntity {
  constructor(
    public readonly id: string,
    public readonly branchId: string | null,
    public readonly subjectId: string | null,
    public readonly createdBy: string | null,
    public readonly title: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly instructions: string | null,
    public readonly examType: ExamType,
    public readonly durationMinutes: number,
    public readonly totalQuestions: number,
    public readonly totalScore: number,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
    public readonly isPublished: boolean
  ) {}

  isAvailable(now: Date): boolean {
    return this.isPublished && this.startsAt <= now && this.endsAt >= now
  }

  toSummary(): ExamSummary {
    return {
      id: this.id,
      subjectId: this.subjectId,
      title: this.title,
      slug: this.slug,
      description: this.description,
      examType: this.examType,
      durationMinutes: this.durationMinutes,
      totalQuestions: this.totalQuestions,
      totalScore: this.totalScore,
      startsAt: this.startsAt,
      endsAt: this.endsAt,
      isPublished: this.isPublished
    }
  }
}

