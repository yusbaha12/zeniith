/*
Tujuan: Mendefinisikan kontrak repository ujian, soal, sesi, jawaban, dan hasil fase 5.
Caller: Use case student tryout, teacher CRUD ujian, exam processing queue, dan leaderboard realtime.
Dependensi: Entitas exam domain dan enum shared.
Main Functions: Menyediakan operasi baca/tulis ujian dengan query minimum cost untuk list, sesi, jawaban, grading, dan leaderboard.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { ExamType, QuestionType, SessionStatus } from '@lms-bimbel/shared'

import type {
  ExamEntity,
  ExamQuestion,
  ExamResultSummary,
  ExamSessionSummary,
  ExamSummary
} from '../entities/exam.entity'

export interface ExamListItem extends ExamSummary {
  subjectName: string | null
  statusLabel: 'AKAN_DATANG' | 'BERLANGSUNG' | 'SELESAI'
  activeSessionId: string | null
  latestResultPercentage: number | null
}

export interface ExamDetail extends ExamSummary {
  subjectName: string | null
  instructions: string | null
}

export interface TeacherExamListItem extends ExamSummary {
  subjectName: string | null
  participantCount: number
  updatedAt: Date
}

export interface ExamQuestionAnswerSnapshot {
  questionId: string
  selectedOptionId: string | null
  answerText: string | null
  isMarkedDoubt: boolean
}

export interface CreateExamInput {
  branchId: string | null
  subjectId: string | null
  createdBy: string
  title: string
  slug: string
  description: string | null
  instructions: string | null
  examType: ExamType
  durationMinutes: number
  startsAt: Date
  endsAt: Date
  isPublished: boolean
}

export interface CreateQuestionInput {
  examId: string
  questionType: QuestionType
  contentJson: Record<string, unknown>
  explanationJson: Record<string, unknown> | null
  score: number
  sortOrder: number
  options: Array<{
    optionKey: string
    contentJson: Record<string, unknown>
    isCorrect: boolean
    sortOrder: number
  }>
}

export interface UpdateQuestionInput {
  questionType: QuestionType
  contentJson: Record<string, unknown>
  explanationJson: Record<string, unknown> | null
  score: number
  sortOrder: number
  options: Array<{
    id?: string
    optionKey: string
    contentJson: Record<string, unknown>
    isCorrect: boolean
    sortOrder: number
  }>
}

export interface CreateExamSessionInput {
  examId: string
  userId: string
  startedAt: Date
  expiresAt: Date
}

export interface UpsertAnswerInput {
  sessionId: string
  questionId: string
  selectedOptionId?: string | null
  answerText?: string | null
  isMarkedDoubt?: boolean
}

export interface SaveExamResultInput extends ExamResultSummary {}

export interface LeaderboardEntry {
  sessionId: string
  examId: string
  userId: string
  name: string
  branchName: string
  score: number
  maxScore: number
  percentage: number
  durationSeconds: number
  gradedAt: Date
}

export interface IExamRepository {
  listAvailableExams(userId: string, branchId: string | null, now: Date): Promise<ExamListItem[]>
  listByTeacher(teacherId: string, branchId: string | null): Promise<TeacherExamListItem[]>
  listAllExams(): Promise<TeacherExamListItem[]>
  findById(examId: string): Promise<ExamEntity | null>
  findDetailById(examId: string): Promise<ExamDetail | null>
  findTeacherExamById(examId: string, teacherId: string): Promise<TeacherExamListItem | null>
  findWithQuestions(examId: string): Promise<{ exam: ExamEntity; questions: ExamQuestion[] } | null>
  findQuestionById(questionId: string): Promise<ExamQuestion | null>
  findSessionById(sessionId: string): Promise<ExamSessionSummary | null>
  findActiveSession(examId: string, userId: string): Promise<ExamSessionSummary | null>
  findLatestSession(examId: string, userId: string): Promise<ExamSessionSummary | null>
  findResultBySessionId(sessionId: string): Promise<ExamResultSummary | null>
  listAnswerSnapshots(sessionId: string): Promise<ExamQuestionAnswerSnapshot[]>
  createExam(input: CreateExamInput, executor?: unknown): Promise<ExamEntity>
  createQuestion(input: CreateQuestionInput, executor?: unknown): Promise<ExamQuestion>
  updateQuestion(questionId: string, input: UpdateQuestionInput, executor?: unknown): Promise<ExamQuestion>
  createSession(input: CreateExamSessionInput, executor?: unknown): Promise<ExamSessionSummary>
  updateSessionStatus(
    sessionId: string,
    status: SessionStatus,
    submittedAt: Date | null,
    isAutoSubmitted: boolean,
    executor?: unknown
  ): Promise<ExamSessionSummary>
  upsertAnswer(input: UpsertAnswerInput, executor?: unknown): Promise<void>
  saveResult(input: SaveExamResultInput, executor?: unknown): Promise<ExamResultSummary>
  recalculateExamStats(examId: string, executor?: unknown): Promise<void>
  countLeaderboardParticipants(examId: string): Promise<number>
  listLeaderboardEntries(examId: string, limit: number): Promise<LeaderboardEntry[]>
  findLeaderboardEntryBySessionId(sessionId: string): Promise<LeaderboardEntry | null>
  findLatestResultSessionIdByExamAndUser(examId: string, userId: string): Promise<string | null>
  findLeaderboardRankBySessionId(sessionId: string): Promise<number | null>
  findLatestResultByUser(userId: string): Promise<ExamResultSummary | null>
}
