/*
Tujuan: Menyediakan DTO validasi request fase 4 untuk student tryout dan teacher CRUD ujian.
Caller: Exam controller student dan teacher.
Dependensi: Elysia validator `t` dan enum ujian/shared.
Main Functions: Memvalidasi params dan body JSON untuk daftar ujian, sesi, jawaban, hasil, dan manajemen soal.
Side Effects: Tidak ada; hanya schema validasi runtime.
*/

import { t } from 'elysia'

export const ExamIdParamsDto = t.Object({
  id: t.String({ format: 'uuid' })
})

export const SessionIdParamsDto = t.Object({
  id: t.String({ format: 'uuid' })
})

export const QuestionIdParamsDto = t.Object({
  id: t.String({ format: 'uuid' })
})

export const ExamTypeDto = t.Union([
  t.Literal('TRYOUT'),
  t.Literal('LATIHAN'),
  t.Literal('MID_EXAM'),
  t.Literal('FINAL_EXAM')
])

export const QuestionTypeDto = t.Union([
  t.Literal('MULTIPLE_CHOICE'),
  t.Literal('ESSAY')
])

export const JsonContentDto = t.Record(t.String(), t.Any())

export const CreateExamDto = t.Object({
  subjectId: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
  title: t.String({ minLength: 3, maxLength: 180 }),
  description: t.Optional(t.Nullable(t.String({ maxLength: 1000 }))),
  instructions: t.Optional(t.Nullable(t.String({ maxLength: 4000 }))),
  examType: ExamTypeDto,
  durationMinutes: t.Numeric({ minimum: 1, maximum: 600 }),
  startsAt: t.String({ format: 'date-time' }),
  endsAt: t.String({ format: 'date-time' }),
  isPublished: t.Boolean()
})

export const QuestionOptionDto = t.Object({
  id: t.Optional(t.String({ format: 'uuid' })),
  optionKey: t.String({ minLength: 1, maxLength: 2 }),
  contentJson: JsonContentDto,
  isCorrect: t.Boolean(),
  sortOrder: t.Numeric({ minimum: 0, maximum: 99 })
})

export const CreateQuestionDto = t.Object({
  questionType: QuestionTypeDto,
  contentJson: JsonContentDto,
  explanationJson: t.Optional(t.Nullable(JsonContentDto)),
  score: t.Numeric({ minimum: 1, maximum: 100 }),
  sortOrder: t.Numeric({ minimum: 0, maximum: 9999 }),
  options: t.Array(QuestionOptionDto)
})

export const UpdateQuestionDto = CreateQuestionDto

export const SubmitAnswerDto = t.Object({
  questionId: t.String({ format: 'uuid' }),
  selectedOptionId: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
  answerText: t.Optional(t.Nullable(t.String({ maxLength: 4000 }))),
  isMarkedDoubt: t.Optional(t.Boolean()),
  idempotencyKey: t.String({ minLength: 8, maxLength: 120 })
})

