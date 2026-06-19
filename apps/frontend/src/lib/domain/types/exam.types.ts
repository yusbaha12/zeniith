/*
Tujuan: Mendefinisikan tipe frontend fase 5 untuk daftar ujian, sesi, soal, jawaban, hasil, dan leaderboard realtime.
Caller: Halaman student tryout, halaman teacher ujian, halaman leaderboard, dan exam API frontend.
Dependensi: Tidak ada dependensi runtime; hanya TypeScript type system.
Main Functions: Menyatukan kontrak data ujian dan leaderboard dari backend ke komponen frontend.
Side Effects: Tidak ada; hanya definisi tipe.
*/

export interface FrontendExamListItem {
  id: string
  subjectId: string | null
  subjectName: string | null
  title: string
  slug: string
  description: string | null
  examType: 'TRYOUT' | 'LATIHAN' | 'MID_EXAM' | 'FINAL_EXAM'
  durationMinutes: number
  totalQuestions: number
  totalScore: number
  startsAt: string
  endsAt: string
  isPublished: boolean
  statusLabel: 'AKAN_DATANG' | 'BERLANGSUNG' | 'SELESAI'
  activeSessionId: string | null
  latestResultPercentage: number | null
}

export interface FrontendExamDetail {
  id: string
  subjectId: string | null
  subjectName: string | null
  title: string
  slug: string
  description: string | null
  instructions: string | null
  examType: 'TRYOUT' | 'LATIHAN' | 'MID_EXAM' | 'FINAL_EXAM'
  durationMinutes: number
  totalQuestions: number
  totalScore: number
  startsAt: string
  endsAt: string
  isPublished: boolean
}

export interface FrontendExamQuestionOption {
  id: string
  optionKey: string
  contentJson: Record<string, unknown>
  sortOrder?: number
  isCorrect?: boolean
}

export interface FrontendExamQuestion {
  id: string
  questionType: 'MULTIPLE_CHOICE' | 'ESSAY'
  contentJson: Record<string, unknown>
  explanationJson?: Record<string, unknown> | null
  score: number
  sortOrder: number
  options: FrontendExamQuestionOption[]
}

export interface FrontendExamSession {
  id: string
  examId: string
  userId: string
  status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'TERMINATED'
  warningCount: number
  isAutoSubmitted: boolean
  startedAt: string
  expiresAt: string
  submittedAt: string | null
}

export interface FrontendExamAnswerSnapshot {
  questionId: string
  selectedOptionId: string | null
  answerText: string | null
  isMarkedDoubt: boolean
}

export interface FrontendStartExamPayload {
  session: FrontendExamSession
  exam: FrontendExamDetail
  questions: FrontendExamQuestion[]
}

export interface FrontendSessionSnapshot {
  session: FrontendExamSession
  exam: FrontendExamDetail
  questions: FrontendExamQuestion[]
  answers: FrontendExamAnswerSnapshot[]
}

export interface FrontendExamResult {
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
  submittedAt: string
  gradedAt: string
}

export interface FrontendExamResultPayload {
  result: FrontendExamResult
  exam: FrontendExamDetail
  leaderboard: FrontendLeaderboardSnapshot
  review: Array<{
    id: string
    questionType: 'MULTIPLE_CHOICE' | 'ESSAY'
    contentJson: Record<string, unknown>
    explanationJson: Record<string, unknown> | null
    score: number
    selectedOptionId: string | null
    answerText: string | null
    correctOptionId: string | null
    options: FrontendExamQuestionOption[]
  }>
}

export interface FrontendLeaderboardEntry {
  rank: number
  userId: string
  name: string
  branchName: string
  score: number
  percentage: number
  durationSeconds: number
}

export interface FrontendLeaderboardSnapshot {
  examId: string
  totalParticipants: number
  currentSessionId: string | null
  currentSessionRank: number | null
  updatedAt: string
  entries: FrontendLeaderboardEntry[]
}

export interface FrontendTeacherExamListItem {
  id: string
  subjectId: string | null
  subjectName: string | null
  title: string
  slug: string
  description: string | null
  examType: 'TRYOUT' | 'LATIHAN' | 'MID_EXAM' | 'FINAL_EXAM'
  durationMinutes: number
  totalQuestions: number
  totalScore: number
  startsAt: string
  endsAt: string
  isPublished: boolean
  participantCount: number
  updatedAt: string
}

export interface FrontendTeacherExamDetail {
  exam: FrontendTeacherExamListItem
  questions: FrontendExamQuestion[]
}
