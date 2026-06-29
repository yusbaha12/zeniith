/*
Tujuan: Menyediakan implementasi repository ujian fase 5 berbasis Drizzle untuk teacher, student flow, dan leaderboard.
Caller: Use case exam list/detail/start/submit/result, teacher CRUD ujian, queue grading, dan leaderboard realtime.
Dependensi: AppDatabase, schema exams/questions/options/sessions/answers/results/users/branches, dan ExamMapper.
Main Functions: Menjalankan query list ujian, detail soal, sesi, jawaban, hasil, dan leaderboard dengan join minimum cost serta upsert idempoten.
Side Effects: Membaca dan menulis tabel exam-related pada PostgreSQL.
*/

import { and, asc, count, desc, eq, gt, inArray, lt, or, sql } from 'drizzle-orm'

import type {
  CreateExamInput,
  CreateExamSessionInput,
  CreateQuestionInput,
  ExamDetail,
  ExamListItem,
  ExamQuestionAnswerSnapshot,
  IExamRepository,
  LeaderboardEntry,
  SaveExamResultInput,
  TeacherExamListItem,
  UpdateQuestionInput
} from '../../domain/repositories/exam.repository'
import type {
  ExamQuestion,
  ExamQuestionOption,
  ExamResultSummary,
  ExamSessionSummary
} from '../../domain/entities/exam.entity'
import type { AppDatabase } from '../database/connection'
import { answers, branches, examResults, exams, examSessions, options, questions, subjects, users } from '../database/schema'
import { ExamMapper } from '../mappers/exam.mapper'

const mapSession = (row: {
  id: string
  examId: string
  userId: string
  status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'TERMINATED'
  warningCount: number
  isAutoSubmitted: boolean
  startedAt: Date
  expiresAt: Date
  submittedAt: Date | null
}): ExamSessionSummary => ({
  id: row.id,
  examId: row.examId,
  userId: row.userId,
  status: row.status,
  warningCount: row.warningCount,
  isAutoSubmitted: row.isAutoSubmitted,
  startedAt: row.startedAt,
  expiresAt: row.expiresAt,
  submittedAt: row.submittedAt
})

const mapResult = (row: {
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
}): ExamResultSummary => ({
  sessionId: row.sessionId,
  examId: row.examId,
  userId: row.userId,
  totalQuestions: row.totalQuestions,
  answeredQuestions: row.answeredQuestions,
  correctAnswers: row.correctAnswers,
  wrongAnswers: row.wrongAnswers,
  unansweredQuestions: row.unansweredQuestions,
  score: row.score,
  maxScore: row.maxScore,
  percentage: row.percentage,
  durationSeconds: row.durationSeconds,
  submittedAt: row.submittedAt,
  gradedAt: row.gradedAt
})

const leaderboardOrderBy = [
  desc(examResults.percentage),
  desc(examResults.score),
  asc(examResults.durationSeconds),
  asc(examResults.gradedAt)
] as const

const mapLeaderboardEntry = (row: {
  sessionId: string
  examId: string
  userId: string
  name: string
  branchName: string | null
  score: number
  maxScore: number
  percentage: number
  durationSeconds: number
  gradedAt: Date
}): LeaderboardEntry => ({
  sessionId: row.sessionId,
  examId: row.examId,
  userId: row.userId,
  name: row.name,
  branchName: row.branchName ?? 'Tanpa Cabang',
  score: row.score,
  maxScore: row.maxScore,
  percentage: row.percentage,
  durationSeconds: row.durationSeconds,
  gradedAt: row.gradedAt
})

export class ExamRepositoryImpl implements IExamRepository {
  constructor(
    private readonly database: AppDatabase,
    private readonly readDatabase: AppDatabase = database
  ) {}

  async listAvailableExams(userId: string, branchId: string | null, now: Date): Promise<ExamListItem[]> {
    const examRows = await this.readDatabase
      .select({
        id: exams.id,
        subjectId: exams.subjectId,
        subjectName: subjects.name,
        title: exams.title,
        slug: exams.slug,
        description: exams.description,
        examType: exams.examType,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        totalScore: exams.totalScore,
        startsAt: exams.startsAt,
        endsAt: exams.endsAt,
        isPublished: exams.isPublished
      })
      .from(exams)
      .leftJoin(subjects, eq(subjects.id, exams.subjectId))
      .where(and(
        eq(exams.isPublished, true),
        branchId ? eq(exams.branchId, branchId) : undefined
      ))
      .orderBy(asc(exams.startsAt))

    const examIds = examRows.map((exam) => exam.id)

    const activeSessions = examIds.length === 0
      ? []
      : await this.readDatabase
        .select({
          id: examSessions.id,
          examId: examSessions.examId
        })
        .from(examSessions)
        .where(and(
          eq(examSessions.userId, userId),
          eq(examSessions.status, 'ACTIVE'),
          inArray(examSessions.examId, examIds)
        ))
        .orderBy(desc(examSessions.createdAt))

    const latestResults = examIds.length === 0
      ? []
      : await this.readDatabase
        .select({
          examId: examResults.examId,
          percentage: examResults.percentage,
          gradedAt: examResults.gradedAt
        })
        .from(examResults)
        .where(and(eq(examResults.userId, userId), inArray(examResults.examId, examIds)))
        .orderBy(desc(examResults.gradedAt))

    const activeSessionByExamId = new Map<string, string>()
    for (const session of activeSessions) {
      if (!activeSessionByExamId.has(session.examId)) {
        activeSessionByExamId.set(session.examId, session.id)
      }
    }

    const latestResultByExamId = new Map<string, number>()
    for (const result of latestResults) {
      if (!latestResultByExamId.has(result.examId)) {
        latestResultByExamId.set(result.examId, result.percentage)
      }
    }

    return examRows.map((exam) => ({
      ...exam,
      statusLabel: exam.startsAt > now ? 'AKAN_DATANG' : exam.endsAt < now ? 'SELESAI' : 'BERLANGSUNG',
      activeSessionId: activeSessionByExamId.get(exam.id) ?? null,
      latestResultPercentage: latestResultByExamId.get(exam.id) ?? null
    }))
  }

  async listByTeacher(teacherId: string, branchId: string | null): Promise<any[]> {
    return this.readDatabase
      .select({
        id: exams.id,
        subjectId: exams.subjectId,
        subjectName: subjects.name,
        branchId: exams.branchId,
        branchName: branches.name,
        title: exams.title,
        slug: exams.slug,
        description: exams.description,
        instructions: exams.instructions,
        examType: exams.examType,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        totalScore: exams.totalScore,
        startsAt: exams.startsAt,
        endsAt: exams.endsAt,
        isPublished: exams.isPublished,
        participantCount: sql<number>`cast((
          select count(1)
          from ${examSessions} es
          where es.exam_id = ${exams.id}
        ) as int)`,
        updatedAt: exams.updatedAt
      })
      .from(exams)
      .leftJoin(subjects, eq(subjects.id, exams.subjectId))
      .leftJoin(branches, eq(branches.id, exams.branchId))
      .where(and(eq(exams.createdBy, teacherId), branchId ? eq(exams.branchId, branchId) : undefined))
      .orderBy(desc(exams.updatedAt))
  }

  async listAllExams(): Promise<any[]> {
    return this.readDatabase
      .select({
        id: exams.id,
        subjectId: exams.subjectId,
        subjectName: subjects.name,
        branchId: exams.branchId,
        branchName: branches.name,
        title: exams.title,
        slug: exams.slug,
        description: exams.description,
        instructions: exams.instructions,
        examType: exams.examType,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        totalScore: exams.totalScore,
        startsAt: exams.startsAt,
        endsAt: exams.endsAt,
        isPublished: exams.isPublished,
        participantCount: sql<number>`cast((
          select count(1)
          from ${examSessions} es
          where es.exam_id = ${exams.id}
        ) as int)`,
        updatedAt: exams.updatedAt
      })
      .from(exams)
      .leftJoin(subjects, eq(subjects.id, exams.subjectId))
      .leftJoin(branches, eq(branches.id, exams.branchId))
      .orderBy(desc(exams.updatedAt))
  }

  async findById(examId: string) {
    const [row] = await this.readDatabase.select().from(exams).where(eq(exams.id, examId)).limit(1)
    return row ? ExamMapper.toDomain(row) : null
  }

  async findDetailById(examId: string): Promise<ExamDetail | null> {
    const [row] = await this.readDatabase
      .select({
        id: exams.id,
        subjectId: exams.subjectId,
        subjectName: subjects.name,
        title: exams.title,
        slug: exams.slug,
        description: exams.description,
        instructions: exams.instructions,
        examType: exams.examType,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        totalScore: exams.totalScore,
        startsAt: exams.startsAt,
        endsAt: exams.endsAt,
        isPublished: exams.isPublished
      })
      .from(exams)
      .leftJoin(subjects, eq(subjects.id, exams.subjectId))
      .where(eq(exams.id, examId))
      .limit(1)

    return row ?? null
  }

  async findTeacherExamById(examId: string, teacherId: string): Promise<TeacherExamListItem | null> {
    const [row] = await this.readDatabase
      .select({
        id: exams.id,
        subjectId: exams.subjectId,
        subjectName: subjects.name,
        branchId: exams.branchId,
        branchName: branches.name,
        title: exams.title,
        slug: exams.slug,
        description: exams.description,
        instructions: exams.instructions,
        examType: exams.examType,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        totalScore: exams.totalScore,
        startsAt: exams.startsAt,
        endsAt: exams.endsAt,
        isPublished: exams.isPublished,
        participantCount: sql<number>`cast((
          select count(1)
          from ${examSessions} es
          where es.exam_id = ${exams.id}
        ) as int)`,
        updatedAt: exams.updatedAt
      })
      .from(exams)
      .leftJoin(subjects, eq(subjects.id, exams.subjectId))
      .leftJoin(branches, eq(branches.id, exams.branchId))
      .where(and(eq(exams.id, examId), eq(exams.createdBy, teacherId)))
      .limit(1)

    return (row as TeacherExamListItem) ?? null
  }

  async findWithQuestions(examId: string): Promise<{ exam: ReturnType<typeof ExamMapper.toDomain>; questions: ExamQuestion[] } | null> {
    const exam = await this.findById(examId)
    if (!exam) {
      return null
    }

    const questionRows = await this.readDatabase
      .select()
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(asc(questions.sortOrder), asc(questions.createdAt))

    if (questionRows.length === 0) {
      return {
        exam,
        questions: []
      }
    }

    const optionRows = await this.readDatabase
      .select()
      .from(options)
      .where(inArray(options.questionId, questionRows.map((row) => row.id)))
      .orderBy(asc(options.sortOrder), asc(options.createdAt))

    const optionsByQuestionId = new Map<string, ExamQuestionOption[]>()
    for (const optionRow of optionRows) {
      const current = optionsByQuestionId.get(optionRow.questionId) ?? []
      current.push({
        id: optionRow.id,
        optionKey: optionRow.optionKey,
        contentJson: optionRow.contentJson as Record<string, unknown>,
        isCorrect: optionRow.isCorrect,
        sortOrder: optionRow.sortOrder
      })
      optionsByQuestionId.set(optionRow.questionId, current)
    }

    return {
      exam,
      questions: questionRows.map((row) => ({
        id: row.id,
        examId: row.examId,
        questionType: row.questionType,
        contentJson: row.contentJson as Record<string, unknown>,
        explanationJson: row.explanationJson as Record<string, unknown> | null,
        score: row.score,
        sortOrder: row.sortOrder,
        options: optionsByQuestionId.get(row.id) ?? []
      }))
    }
  }

  async findQuestionById(questionId: string): Promise<ExamQuestion | null> {
    const [questionRow] = await this.readDatabase
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)

    if (!questionRow) {
      return null
    }

    const optionRows = await this.readDatabase
      .select()
      .from(options)
      .where(eq(options.questionId, questionId))
      .orderBy(asc(options.sortOrder), asc(options.createdAt))

    return {
      id: questionRow.id,
      examId: questionRow.examId,
      questionType: questionRow.questionType,
      contentJson: questionRow.contentJson as Record<string, unknown>,
      explanationJson: questionRow.explanationJson as Record<string, unknown> | null,
      score: questionRow.score,
      sortOrder: questionRow.sortOrder,
      options: optionRows.map((row) => ({
        id: row.id,
        optionKey: row.optionKey,
        contentJson: row.contentJson as Record<string, unknown>,
        isCorrect: row.isCorrect,
        sortOrder: row.sortOrder
      }))
    }
  }

  async findSessionById(sessionId: string): Promise<ExamSessionSummary | null> {
    const [row] = await this.readDatabase.select().from(examSessions).where(eq(examSessions.id, sessionId)).limit(1)
    return row ? mapSession(row) : null
  }

  async findActiveSession(examId: string, userId: string): Promise<ExamSessionSummary | null> {
    const [row] = await this.readDatabase
      .select()
      .from(examSessions)
      .where(and(eq(examSessions.examId, examId), eq(examSessions.userId, userId), eq(examSessions.status, 'ACTIVE')))
      .orderBy(desc(examSessions.createdAt))
      .limit(1)

    return row ? mapSession(row) : null
  }

  async findLatestSession(examId: string, userId: string): Promise<ExamSessionSummary | null> {
    const [row] = await this.readDatabase
      .select()
      .from(examSessions)
      .where(and(eq(examSessions.examId, examId), eq(examSessions.userId, userId)))
      .orderBy(desc(examSessions.createdAt))
      .limit(1)

    return row ? mapSession(row) : null
  }

  async findResultBySessionId(sessionId: string): Promise<ExamResultSummary | null> {
    const [row] = await this.readDatabase
      .select()
      .from(examResults)
      .where(eq(examResults.sessionId, sessionId))
      .limit(1)

    return row ? mapResult(row) : null
  }

  async listAnswerSnapshots(sessionId: string): Promise<ExamQuestionAnswerSnapshot[]> {
    const rows = await this.readDatabase
      .select({
        questionId: answers.questionId,
        selectedOptionId: answers.selectedOptionId,
        answerText: answers.answerText,
        isMarkedDoubt: answers.isMarkedDoubt
      })
      .from(answers)
      .where(eq(answers.sessionId, sessionId))

    return rows
  }

  async createExam(input: CreateExamInput, executor?: unknown) {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .insert(exams)
      .values({
        branchId: input.branchId,
        subjectId: input.subjectId,
        createdBy: input.createdBy,
        title: input.title,
        slug: input.slug,
        description: input.description,
        instructions: input.instructions,
        examType: input.examType,
        durationMinutes: input.durationMinutes,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isPublished: input.isPublished
      })
      .returning()

    return ExamMapper.toDomain(row)
  }

  async updateExam(examId: string, input: Partial<CreateExamInput>, executor?: unknown) {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .update(exams)
      .set({
        ...(input.branchId !== undefined && { branchId: input.branchId }),
        ...(input.subjectId !== undefined && { subjectId: input.subjectId }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.instructions !== undefined && { instructions: input.instructions }),
        ...(input.examType !== undefined && { examType: input.examType }),
        ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
        ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
        ...(input.endsAt !== undefined && { endsAt: input.endsAt }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        updatedAt: new Date()
      })
      .where(eq(exams.id, examId))
      .returning()

    if (!row) {
      throw new Error('Exam not found')
    }
    return ExamMapper.toDomain(row)
  }

  async deleteExam(examId: string, executor?: unknown) {
    const database = (executor as AppDatabase | undefined) ?? this.database
    await database
      .delete(exams)
      .where(eq(exams.id, examId))
  }


  async createQuestion(input: CreateQuestionInput, executor?: unknown): Promise<ExamQuestion> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [questionRow] = await database
      .insert(questions)
      .values({
        examId: input.examId,
        questionType: input.questionType,
        contentJson: input.contentJson,
        explanationJson: input.explanationJson,
        score: input.score,
        sortOrder: input.sortOrder
      })
      .returning()

    const optionRows = input.options.length === 0
      ? []
      : await database
        .insert(options)
        .values(input.options.map((option) => ({
          questionId: questionRow.id,
          optionKey: option.optionKey,
          contentJson: option.contentJson,
          isCorrect: option.isCorrect,
          sortOrder: option.sortOrder
        })))
        .returning()

    return {
      id: questionRow.id,
      examId: questionRow.examId,
      questionType: questionRow.questionType,
      contentJson: questionRow.contentJson as Record<string, unknown>,
      explanationJson: questionRow.explanationJson as Record<string, unknown> | null,
      score: questionRow.score,
      sortOrder: questionRow.sortOrder,
      options: optionRows.map((row) => ({
        id: row.id,
        optionKey: row.optionKey,
        contentJson: row.contentJson as Record<string, unknown>,
        isCorrect: row.isCorrect,
        sortOrder: row.sortOrder
      }))
    }
  }

  async updateQuestion(questionId: string, input: UpdateQuestionInput, executor?: unknown): Promise<ExamQuestion> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [questionRow] = await database
      .update(questions)
      .set({
        questionType: input.questionType,
        contentJson: input.contentJson,
        explanationJson: input.explanationJson,
        score: input.score,
        sortOrder: input.sortOrder,
        updatedAt: new Date()
      })
      .where(eq(questions.id, questionId))
      .returning()

    await database.delete(options).where(eq(options.questionId, questionId))

    const optionRows = input.options.length === 0
      ? []
      : await database
        .insert(options)
        .values(input.options.map((option) => ({
          questionId,
          optionKey: option.optionKey,
          contentJson: option.contentJson,
          isCorrect: option.isCorrect,
          sortOrder: option.sortOrder
        })))
        .returning()

    return {
      id: questionRow.id,
      examId: questionRow.examId,
      questionType: questionRow.questionType,
      contentJson: questionRow.contentJson as Record<string, unknown>,
      explanationJson: questionRow.explanationJson as Record<string, unknown> | null,
      score: questionRow.score,
      sortOrder: questionRow.sortOrder,
      options: optionRows.map((row) => ({
        id: row.id,
        optionKey: row.optionKey,
        contentJson: row.contentJson as Record<string, unknown>,
        isCorrect: row.isCorrect,
        sortOrder: row.sortOrder
      }))
    }
  }

  async createSession(input: CreateExamSessionInput, executor?: unknown): Promise<ExamSessionSummary> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .insert(examSessions)
      .values({
        examId: input.examId,
        userId: input.userId,
        status: 'ACTIVE',
        startedAt: input.startedAt,
        expiresAt: input.expiresAt,
        lastHeartbeatAt: input.startedAt
      })
      .returning()

    return mapSession(row)
  }

  async updateSessionStatus(
    sessionId: string,
    status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'TERMINATED',
    submittedAt: Date | null,
    isAutoSubmitted: boolean,
    executor?: unknown
  ): Promise<ExamSessionSummary> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .update(examSessions)
      .set({
        status,
        submittedAt,
        isAutoSubmitted,
        updatedAt: new Date()
      })
      .where(eq(examSessions.id, sessionId))
      .returning()

    return mapSession(row)
  }

  async upsertAnswer(input: {
    sessionId: string
    questionId: string
    selectedOptionId?: string | null
    answerText?: string | null
    isMarkedDoubt?: boolean
  }, executor?: unknown): Promise<void> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const now = new Date()
    await database
      .insert(answers)
      .values({
        sessionId: input.sessionId,
        questionId: input.questionId,
        selectedOptionId: input.selectedOptionId ?? null,
        answerText: input.answerText ?? null,
        isMarkedDoubt: input.isMarkedDoubt ?? false,
        submittedAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [answers.sessionId, answers.questionId],
        set: {
          selectedOptionId: input.selectedOptionId ?? null,
          answerText: input.answerText ?? null,
          isMarkedDoubt: input.isMarkedDoubt ?? false,
          submittedAt: now,
          updatedAt: now
        }
      })
  }

  async saveResult(input: SaveExamResultInput, executor?: unknown): Promise<ExamResultSummary> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .insert(examResults)
      .values({
        sessionId: input.sessionId,
        examId: input.examId,
        userId: input.userId,
        totalQuestions: input.totalQuestions,
        answeredQuestions: input.answeredQuestions,
        correctAnswers: input.correctAnswers,
        wrongAnswers: input.wrongAnswers,
        unansweredQuestions: input.unansweredQuestions,
        score: input.score,
        maxScore: input.maxScore,
        percentage: input.percentage,
        durationSeconds: input.durationSeconds,
        submittedAt: input.submittedAt,
        gradedAt: input.gradedAt,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [examResults.sessionId],
        set: {
          totalQuestions: input.totalQuestions,
          answeredQuestions: input.answeredQuestions,
          correctAnswers: input.correctAnswers,
          wrongAnswers: input.wrongAnswers,
          unansweredQuestions: input.unansweredQuestions,
          score: input.score,
          maxScore: input.maxScore,
          percentage: input.percentage,
          durationSeconds: input.durationSeconds,
          submittedAt: input.submittedAt,
          gradedAt: input.gradedAt,
          updatedAt: new Date()
        }
      })
      .returning()

    return mapResult(row)
  }

  async recalculateExamStats(examId: string, executor?: unknown): Promise<void> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [aggregate] = await database
      .select({
        totalQuestions: sql<number>`coalesce(count(${questions.id}), 0)`,
        totalScore: sql<number>`coalesce(sum(${questions.score}), 0)`
      })
      .from(questions)
      .where(eq(questions.examId, examId))

    await database
      .update(exams)
      .set({
        totalQuestions: aggregate?.totalQuestions ?? 0,
        totalScore: aggregate?.totalScore ?? 0,
        updatedAt: new Date()
      })
      .where(eq(exams.id, examId))
  }

  async countLeaderboardParticipants(examId: string): Promise<number> {
    const [aggregate] = await this.readDatabase
      .select({
        total: count()
      })
      .from(examResults)
      .where(eq(examResults.examId, examId))

    return aggregate?.total ?? 0
  }

  async listLeaderboardEntries(examId: string, limit: number): Promise<LeaderboardEntry[]> {
    const rows = await this.readDatabase
      .select({
        sessionId: examResults.sessionId,
        examId: examResults.examId,
        userId: examResults.userId,
        name: users.name,
        branchName: branches.name,
        score: examResults.score,
        maxScore: examResults.maxScore,
        percentage: examResults.percentage,
        durationSeconds: examResults.durationSeconds,
        gradedAt: examResults.gradedAt
      })
      .from(examResults)
      .innerJoin(users, eq(users.id, examResults.userId))
      .leftJoin(branches, eq(branches.id, users.branchId))
      .where(eq(examResults.examId, examId))
      .orderBy(...leaderboardOrderBy)
      .limit(limit)

    return rows.map((row) => mapLeaderboardEntry(row))
  }

  async findLeaderboardEntryBySessionId(sessionId: string): Promise<LeaderboardEntry | null> {
    const [row] = await this.readDatabase
      .select({
        sessionId: examResults.sessionId,
        examId: examResults.examId,
        userId: examResults.userId,
        name: users.name,
        branchName: branches.name,
        score: examResults.score,
        maxScore: examResults.maxScore,
        percentage: examResults.percentage,
        durationSeconds: examResults.durationSeconds,
        gradedAt: examResults.gradedAt
      })
      .from(examResults)
      .innerJoin(users, eq(users.id, examResults.userId))
      .leftJoin(branches, eq(branches.id, users.branchId))
      .where(eq(examResults.sessionId, sessionId))
      .limit(1)

    return row ? mapLeaderboardEntry(row) : null
  }

  async findLatestResultSessionIdByExamAndUser(examId: string, userId: string): Promise<string | null> {
    const [row] = await this.readDatabase
      .select({
        sessionId: examResults.sessionId
      })
      .from(examResults)
      .where(and(eq(examResults.examId, examId), eq(examResults.userId, userId)))
      .orderBy(desc(examResults.gradedAt))
      .limit(1)

    return row?.sessionId ?? null
  }

  async findLeaderboardRankBySessionId(sessionId: string): Promise<number | null> {
    const current = await this.findLeaderboardEntryBySessionId(sessionId)

    if (!current) {
      return null
    }

    const [aggregate] = await this.readDatabase
      .select({
        total: count()
      })
      .from(examResults)
      .where(and(
        eq(examResults.examId, current.examId),
        or(
          gt(examResults.percentage, current.percentage),
          and(eq(examResults.percentage, current.percentage), gt(examResults.score, current.score)),
          and(
            eq(examResults.percentage, current.percentage),
            eq(examResults.score, current.score),
            lt(examResults.durationSeconds, current.durationSeconds)
          ),
          and(
            eq(examResults.percentage, current.percentage),
            eq(examResults.score, current.score),
            eq(examResults.durationSeconds, current.durationSeconds),
            lt(examResults.gradedAt, current.gradedAt)
          )
        )
      ))

    return (aggregate?.total ?? 0) + 1
  }

  async findLatestResultByUser(userId: string): Promise<ExamResultSummary | null> {
    const [row] = await this.readDatabase
      .select()
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .orderBy(desc(examResults.gradedAt))
      .limit(1)

    return row ? mapResult(row) : null
  }
}
