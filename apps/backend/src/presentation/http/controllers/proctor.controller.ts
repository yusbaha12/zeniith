/*
Tujuan: Menyediakan endpoint guru fase 6 untuk live monitor proctoring, paksa akhiri sesi, riwayat log kecurangan, dan memberi warning manual.
Caller: Frontend area guru `/teacher/ujian/:id/monitor`.
Dependensi: Auth middleware, RBAC teacher, permission guard, DTO proctor, dan use case proctoring.
Main Functions: Mengelola request HTTP live proctoring dan aksi penertiban dari pengawas/guru.
Side Effects: Membaca/menulis data proctor logs, warnings, dan sesi ujian.
*/

import { Elysia } from 'elysia'

import {
  ProctorExamParamsDto,
  ProctorSessionParamsDto,
  WarnStudentBodyDto
} from '../../../application/dto/proctor.dto'
import type { GetLiveProctorDataUseCase } from '../../../application/use-cases/proctor/get-live-proctor-data.usecase'
import type { GetProctorLogUseCase } from '../../../application/use-cases/proctor/get-proctor-log.usecase'
import type { TerminateSessionUseCase } from '../../../application/use-cases/proctor/terminate-session.usecase'
import type { WarnStudentUseCase } from '../../../application/use-cases/proctor/warn-student.usecase'
import { withPermissions } from '../middlewares/permission.middleware'
import { rbac } from '../middlewares/rbac.middleware'

export const createProctorController = (
  authMiddleware: any,
  getLiveProctorDataUseCase: GetLiveProctorDataUseCase,
  getProctorLogUseCase: GetProctorLogUseCase,
  terminateSessionUseCase: TerminateSessionUseCase,
  warnStudentUseCase: WarnStudentUseCase
) =>
  new Elysia({ prefix: '/api/teacher' })
    .use(authMiddleware)
    .use(rbac('TEACHER'))
    .get('/exams/:id/proctor', withPermissions(['proctor.monitor'], async ({ params }: any) => ({
      success: true,
      data: await getLiveProctorDataUseCase.execute({ examId: params.id }),
      message: 'Data monitor proctoring live berhasil diambil'
    })), {
      params: ProctorExamParamsDto
    })
    .get('/sessions/:id/proctor-log', withPermissions(['proctor.log.view'], async ({ params }: any) => ({
      success: true,
      data: await getProctorLogUseCase.execute({ sessionId: params.id }),
      message: 'Riwayat log proctoring murid berhasil diambil'
    })), {
      params: ProctorSessionParamsDto
    })
    .post('/sessions/:id/terminate', withPermissions(['proctor.terminate'], async ({ params }: any) => ({
      success: true,
      data: await terminateSessionUseCase.execute({ sessionId: params.id }),
      message: 'Sesi ujian berhasil dihentikan paksa'
    })), {
      params: ProctorSessionParamsDto
    })
    .post('/sessions/:id/warn', withPermissions(['proctor.monitor'], async ({ params, body }: any) => ({
      success: true,
      data: await warnStudentUseCase.execute({
        sessionId: params.id,
        userId: body.userId,
        message: body.message
      }),
      message: 'Peringatan kecurangan berhasil dikirim'
    })), {
      params: ProctorSessionParamsDto,
      body: WarnStudentBodyDto
    })
