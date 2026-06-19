/*
Tujuan: Menyediakan endpoint student fase 3 untuk subject, module, detail materi, dan track progress.
Caller: Frontend area murid `/student/materi`.
Dependensi: Auth middleware, subscription middleware, DTO material, dan use case ruang belajar.
Main Functions: Mengembalikan katalog belajar, detail materi berlangganan, dan menyimpan progres murid.
Side Effects: Membaca tabel subjects/modules/materials serta menulis material_progresses.
*/

import { Elysia } from 'elysia'

import {
  MaterialIdParamsDto,
  ModuleIdParamsDto,
  SubjectIdParamsDto,
  TrackMaterialProgressDto
} from '../../../application/dto/material.dto'
import type { GetMaterialDetailUseCase } from '../../../application/use-cases/material/get-material-detail.usecase'
import type { ListMaterialsByModuleUseCase } from '../../../application/use-cases/material/list-materials-by-module.usecase'
import type { ListModulesBySubjectUseCase } from '../../../application/use-cases/material/list-modules-by-subject.usecase'
import type { ListSubjectsUseCase } from '../../../application/use-cases/material/list-subjects.usecase'
import type { TrackMaterialProgressUseCase } from '../../../application/use-cases/material/track-material-progress.usecase'
import { rbac } from '../middlewares/rbac.middleware'

export const createMaterialController = (
  authMiddleware: any,
  subscriptionMiddleware: any,
  listSubjectsUseCase: ListSubjectsUseCase,
  listModulesBySubjectUseCase: ListModulesBySubjectUseCase,
  listMaterialsByModuleUseCase: ListMaterialsByModuleUseCase,
  getMaterialDetailUseCase: GetMaterialDetailUseCase,
  trackMaterialProgressUseCase: TrackMaterialProgressUseCase
) =>
  new Elysia({ prefix: '/api' })
    .use(authMiddleware)
    .use(rbac('STUDENT', 'TEACHER'))
    .get('/subjects', async ({ user }: any) => ({
      success: true,
      data: await listSubjectsUseCase.execute(user?.id, user?.role),
      message: 'Daftar mata pelajaran berhasil diambil'
    }))
    .get('/subjects/:id/modules', async ({ params }) => ({
      success: true,
      data: await listModulesBySubjectUseCase.execute(params.id),
      message: 'Daftar modul berhasil diambil'
    }), {
      params: SubjectIdParamsDto
    })
    .use(subscriptionMiddleware)
    .get('/modules/:id/materials', async ({ params, user }: any) => ({
      success: true,
      data: await listMaterialsByModuleUseCase.execute(params.id, user.id, user.role),
      message: 'Daftar materi berhasil diambil'
    }), {
      params: ModuleIdParamsDto
    })
    .get('/materials/:id', async ({ params }) => ({
      success: true,
      data: await getMaterialDetailUseCase.execute(params.id),
      message: 'Detail materi berhasil diambil'
    }), {
      params: MaterialIdParamsDto
    })
    .post('/materials/:id/progress', async ({ params, body, user }: any) => ({
      success: true,
      data: await trackMaterialProgressUseCase.execute(
        user.id,
        params.id,
        Number(body.progressPercent),
        body.isCompleted
      ),
      message: 'Progress materi berhasil diperbarui'
    }), {
      params: MaterialIdParamsDto,
      body: TrackMaterialProgressDto
    })
