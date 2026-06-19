/*
Tujuan: Menyediakan endpoint murid fase 5 untuk daftar ujian, mulai sesi, hasil, dan leaderboard realtime dengan guard permission granular.
Caller: Frontend area murid `/student/tryout` dan `/student/leaderboard`.
Dependensi: Auth middleware, subscription middleware, permission guard, DTO exam, dan use case student tryout/leaderboard.
Main Functions: Mengelola alur ujian murid dari pra-ujian hingga hasil akhir, termasuk snapshot leaderboard secara aman dan terukur.
Side Effects: Membaca/menulis tabel exams, sessions, answers, results, serta dapat memicu queue grading dan read leaderboard.
*/

import { Elysia } from 'elysia'

import {
  ExamIdParamsDto,
  SessionIdParamsDto,
  SubmitAnswerDto
} from '../../../application/dto/exam.dto'
import type { GetExamDetailUseCase } from '../../../application/use-cases/exam/get-exam-detail.usecase'
import type { GetExamLeaderboardUseCase } from '../../../application/use-cases/exam/get-exam-leaderboard.usecase'
import type { GetExamResultUseCase } from '../../../application/use-cases/exam/get-exam-result.usecase'
import type { GetSessionSnapshotUseCase } from '../../../application/use-cases/exam/get-session-snapshot.usecase'
import type { ListExamsUseCase } from '../../../application/use-cases/exam/list-exams.usecase'
import type { StartExamUseCase } from '../../../application/use-cases/exam/start-exam.usecase'
import type { SubmitAnswerUseCase } from '../../../application/use-cases/exam/submit-answer.usecase'
import type { SubmitExamUseCase } from '../../../application/use-cases/exam/submit-exam.usecase'
import type { GetAdaptiveRecommendationUseCase } from '../../../application/use-cases/exam/get-adaptive-recommendation.usecase'
import { withPermissions } from '../middlewares/permission.middleware'
import { rbac } from '../middlewares/rbac.middleware'

export const createExamController = (
  authMiddleware: any,
  subscriptionMiddleware: any,
  listExamsUseCase: ListExamsUseCase,
  getExamDetailUseCase: GetExamDetailUseCase,
  getExamLeaderboardUseCase: GetExamLeaderboardUseCase,
  startExamUseCase: StartExamUseCase,
  getSessionSnapshotUseCase: GetSessionSnapshotUseCase,
  submitAnswerUseCase: SubmitAnswerUseCase,
  submitExamUseCase: SubmitExamUseCase,
  getExamResultUseCase: GetExamResultUseCase,
  getAdaptiveRecommendationUseCase: GetAdaptiveRecommendationUseCase
) =>
  new Elysia({ prefix: '/api' })
    .use(authMiddleware)
    .use(rbac('STUDENT'))
    .use(subscriptionMiddleware)
    .get('/exams', withPermissions(['exam.view'], async ({ user }: any) => ({
      success: true,
      data: await listExamsUseCase.execute(user.id, user.branchId),
      message: 'Daftar ujian berhasil diambil'
    })))
    .get('/exams/:id', withPermissions(['exam.view'], async ({ params }: any) => ({
      success: true,
      data: await getExamDetailUseCase.execute(params.id),
      message: 'Detail ujian berhasil diambil'
    })), {
      params: ExamIdParamsDto
    })
    .get('/exams/:id/leaderboard', withPermissions(['leaderboard.view'], async ({ params, user }: any) => ({
      success: true,
      data: await getExamLeaderboardUseCase.execute(params.id, user.id),
      message: 'Leaderboard ujian berhasil diambil'
    })), {
      params: ExamIdParamsDto
    })
    .post('/exams/:id/sessions', withPermissions(['exam.take'], async ({ params, user }: any) => ({
      success: true,
      data: await startExamUseCase.execute(params.id, user.id),
      message: 'Sesi ujian berhasil dimulai'
    })), {
      params: ExamIdParamsDto
    })
    .get('/sessions/:id', withPermissions(['exam.take'], async ({ params, user }: any) => ({
      success: true,
      data: await getSessionSnapshotUseCase.execute(params.id, user.id),
      message: 'Snapshot sesi ujian berhasil diambil'
    })), {
      params: SessionIdParamsDto
    })
    .post('/sessions/:id/answers', withPermissions(['exam.take'], async ({ params, body, user }: any) => ({
      success: true,
      data: await submitAnswerUseCase.execute(params.id, user.id, body),
      message: 'Jawaban berhasil diterima'
    })), {
      params: SessionIdParamsDto,
      body: SubmitAnswerDto
    })
    .post('/sessions/:id/submit', withPermissions(['exam.take'], async ({ params, user }: any) => ({
      success: true,
      data: await submitExamUseCase.execute(params.id, user.id),
      message: 'Sesi ujian berhasil diselesaikan'
    })), {
      params: SessionIdParamsDto
    })
    .get('/sessions/:id/result', withPermissions(['exam.result.self.view'], async ({ params, user }: any) => ({
      success: true,
      data: await getExamResultUseCase.execute(params.id, user.id),
      message: 'Hasil ujian berhasil diambil'
    })), {
      params: SessionIdParamsDto
    })
    .get('/student/adaptive-recommendation', withPermissions(['exam.view'], async ({ user }: any) => ({
      success: true,
      data: await getAdaptiveRecommendationUseCase.execute(user.id),
      message: 'Rekomendasi belajar adaptif berhasil dihitung'
    })))
