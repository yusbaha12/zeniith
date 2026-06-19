/*
Tujuan: Menyediakan utilitas domain aplikasi fase 4 untuk validasi jadwal ujian, opsi soal, dan perhitungan grading.
Caller: Use case student tryout, teacher CRUD ujian, dan exam processing queue.
Dependensi: Entitas ujian/soal/sesi dan AppError.
Main Functions: Membuat slug ujian, memvalidasi setup soal, menghitung hasil akhir, dan menentukan status ujian relatif terhadap waktu.
Side Effects: Tidak ada; murni komputasi dan validasi in-memory.
*/

import type { QuestionType } from '@lms-bimbel/shared'

import type { ExamQuestion, ExamResultSummary, ExamSessionSummary } from '../../domain/entities/exam.entity'
import type { ExamQuestionAnswerSnapshot } from '../../domain/repositories/exam.repository'
import { AppError } from '../../shared/errors/app.error'

export class ExamService {
  createSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  validateSchedule(startsAt: Date, endsAt: Date, durationMinutes: number): void {
    if (endsAt <= startsAt) {
      throw new AppError('Waktu selesai ujian harus setelah waktu mulai', 422, 'INVALID_EXAM_SCHEDULE')
    }

    if (durationMinutes <= 0) {
      throw new AppError('Durasi ujian harus lebih dari 0 menit', 422, 'INVALID_EXAM_DURATION')
    }

    const maxDurationBySchedule = Math.floor((endsAt.getTime() - startsAt.getTime()) / 60_000)
    if (durationMinutes > maxDurationBySchedule) {
      throw new AppError('Durasi ujian melebihi rentang jadwal yang tersedia', 422, 'INVALID_EXAM_DURATION')
    }
  }

  validateQuestion(questionType: QuestionType, options: Array<{ isCorrect: boolean }>): void {
    if (questionType === 'MULTIPLE_CHOICE') {
      if (options.length < 2) {
        throw new AppError('Soal pilihan ganda minimal memiliki 2 opsi', 422, 'INVALID_QUESTION_OPTIONS')
      }

      const correctCount = options.filter((option) => option.isCorrect).length
      if (correctCount !== 1) {
        throw new AppError('Soal pilihan ganda harus memiliki tepat 1 jawaban benar', 422, 'INVALID_QUESTION_OPTIONS')
      }
    }
  }

  getExamStatus(startsAt: Date, endsAt: Date, now: Date): 'AKAN_DATANG' | 'BERLANGSUNG' | 'SELESAI' {
    if (startsAt > now) {
      return 'AKAN_DATANG'
    }

    if (endsAt < now) {
      return 'SELESAI'
    }

    return 'BERLANGSUNG'
  }

  private getIrtWeight(questionId: string): number {
    let hash = 0
    for (let i = 0; i < questionId.length; i++) {
      hash = questionId.charCodeAt(i) + ((hash << 5) - hash)
    }
    const ratio = Math.abs(hash % 100) / 100
    // Bobot kesulitan berkisar antara 0.5 (mudah) s.d. 2.0 (sangat sulit)
    return 0.5 + ratio * 1.5
  }

  computeResult(
    session: ExamSessionSummary,
    questions: ExamQuestion[],
    answers: ExamQuestionAnswerSnapshot[],
    gradedAt: Date
  ): Omit<ExamResultSummary, 'sessionId' | 'examId' | 'userId'> {
    const answersByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]))
    let answeredQuestions = 0
    let correctAnswers = 0
    let wrongAnswers = 0
    let score = 0

    for (const question of questions) {
      const answer = answersByQuestionId.get(question.id)
      const hasAnswer = !!answer?.selectedOptionId || !!answer?.answerText

      if (!hasAnswer) {
        continue
      }

      answeredQuestions += 1

      if (question.questionType === 'MULTIPLE_CHOICE') {
        const correctOption = question.options.find((option) => option.isCorrect)
        const isCorrect = !!correctOption && correctOption.id === answer?.selectedOptionId

        if (isCorrect) {
          correctAnswers += 1
          const weight = this.getIrtWeight(question.id)
          score += Math.round(question.score * weight)
        } else {
          wrongAnswers += 1
        }
      } else {
        wrongAnswers += 1
      }
    }

    const totalQuestions = questions.length
    const unansweredQuestions = totalQuestions - answeredQuestions
    const maxScore = questions.reduce((total, question) => total + Math.round(question.score * this.getIrtWeight(question.id)), 0)
    const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100)
    const submittedAt = session.submittedAt ?? gradedAt
    const durationSeconds = Math.max(
      0,
      Math.floor((submittedAt.getTime() - session.startedAt.getTime()) / 1000)
    )

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      wrongAnswers,
      unansweredQuestions,
      score,
      maxScore,
      percentage,
      durationSeconds,
      submittedAt,
      gradedAt
    }
  }
}

