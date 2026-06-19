/*
Tujuan: Menyediakan endpoint guru fase 4 untuk daftar ujian, detail, buat ujian, tambah soal, dan edit soal dengan guard permission granular.
Caller: Frontend area guru `/teacher/ujian`.
Dependensi: Auth middleware, RBAC teacher, permission guard, DTO exam, dan use case teacher exam.
Main Functions: Mengelola siklus pembuatan ujian dan soal milik guru secara modular.
Side Effects: Membaca/menulis tabel exams, questions, options, dan agregat statistik ujian.
*/

import { Elysia } from 'elysia'

import {
  CreateExamDto,
  CreateQuestionDto,
  ExamIdParamsDto,
  QuestionIdParamsDto,
  UpdateQuestionDto
} from '../../../application/dto/exam.dto'
import type { CreateExamUseCase } from '../../../application/use-cases/exam/create-exam.usecase'
import type { CreateQuestionUseCase } from '../../../application/use-cases/exam/create-question.usecase'
import type { GetTeacherExamDetailUseCase } from '../../../application/use-cases/exam/get-teacher-exam-detail.usecase'
import type { ListTeacherExamsUseCase } from '../../../application/use-cases/exam/list-teacher-exams.usecase'
import type { UpdateQuestionUseCase } from '../../../application/use-cases/exam/update-question.usecase'
import { withPermissions } from '../middlewares/permission.middleware'
import { rbac } from '../middlewares/rbac.middleware'

export const createTeacherExamController = (
  authMiddleware: any,
  listTeacherExamsUseCase: ListTeacherExamsUseCase,
  getTeacherExamDetailUseCase: GetTeacherExamDetailUseCase,
  createExamUseCase: CreateExamUseCase,
  createQuestionUseCase: CreateQuestionUseCase,
  updateQuestionUseCase: UpdateQuestionUseCase
) =>
  new Elysia({ prefix: '/api/teacher' })
    .use(authMiddleware)
    .use(rbac('TEACHER'))
    .get('/exams', withPermissions(['exam.manage.own'], async ({ user }: any) => ({
      success: true,
      data: await listTeacherExamsUseCase.execute(user.id, user.branchId),
      message: 'Daftar ujian guru berhasil diambil'
    })))
    .get('/exams/:id', withPermissions(['exam.manage.own'], async ({ params, user }: any) => ({
      success: true,
      data: await getTeacherExamDetailUseCase.execute(params.id, user.id),
      message: 'Detail ujian guru berhasil diambil'
    })), {
      params: ExamIdParamsDto
    })
    .post('/exams', withPermissions(['exam.manage.own'], async ({ body, user }: any) => ({
      success: true,
      data: await createExamUseCase.execute({
        teacherId: user.id,
        branchId: user.branchId,
        subjectId: body.subjectId ?? null,
        title: body.title,
        description: body.description ?? null,
        instructions: body.instructions ?? null,
        examType: body.examType,
        durationMinutes: Number(body.durationMinutes),
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        isPublished: body.isPublished
      }),
      message: 'Ujian berhasil dibuat'
    })), {
      body: CreateExamDto
    })
    .post('/exams/:id/questions', withPermissions(['question.manage'], async ({ params, body, user }: any) => ({
      success: true,
      data: await createQuestionUseCase.execute({
        teacherId: user.id,
        examId: params.id,
        questionType: body.questionType,
        contentJson: body.contentJson,
        explanationJson: body.explanationJson ?? null,
        score: Number(body.score),
        sortOrder: Number(body.sortOrder),
        options: body.options.map((option: any) => ({
          optionKey: option.optionKey,
          contentJson: option.contentJson,
          isCorrect: option.isCorrect,
          sortOrder: Number(option.sortOrder)
        }))
      }),
      message: 'Soal berhasil dibuat'
    })), {
      params: ExamIdParamsDto,
      body: CreateQuestionDto
    })
    .patch('/questions/:id', withPermissions(['question.manage'], async ({ params, body, user }: any) => ({
      success: true,
      data: await updateQuestionUseCase.execute({
        teacherId: user.id,
        questionId: params.id,
        questionType: body.questionType,
        contentJson: body.contentJson,
        explanationJson: body.explanationJson ?? null,
        score: Number(body.score),
        sortOrder: Number(body.sortOrder),
        options: body.options.map((option: any) => ({
          id: option.id,
          optionKey: option.optionKey,
          contentJson: option.contentJson,
          isCorrect: option.isCorrect,
          sortOrder: Number(option.sortOrder)
        }))
      }),
      message: 'Soal berhasil diperbarui'
    })), {
      params: QuestionIdParamsDto,
      body: UpdateQuestionDto
    })
