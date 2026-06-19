/*
Tujuan: Menyediakan endpoint guru fase 3 untuk list, detail, create, update, delete, dan upload image materi dengan guard permission granular.
Caller: Frontend area guru `/teacher/materi`.
Dependensi: Auth middleware, RBAC teacher, permission guard, DTO material, dan use case CRUD materi guru.
Main Functions: Mengelola materi milik guru secara penuh dengan content JSON editor dan attachment opsional.
Side Effects: Membaca/menulis tabel materials serta mengunggah asset image/attachment ke MinIO/S3.
*/

import { Elysia } from 'elysia'

import {
  MaterialIdParamsDto,
  SaveMaterialDto,
  TeacherMaterialsQueryDto,
  UpdateMaterialDto,
  UploadMaterialImageDto
} from '../../../application/dto/material.dto'
import type { CreateMaterialUseCase } from '../../../application/use-cases/material/create-material.usecase'
import type { DeleteMaterialUseCase } from '../../../application/use-cases/material/delete-material.usecase'
import type { GetTeacherMaterialDetailUseCase } from '../../../application/use-cases/material/get-teacher-material-detail.usecase'
import type { ListTeacherMaterialsUseCase } from '../../../application/use-cases/material/list-teacher-materials.usecase'
import type { UpdateMaterialUseCase } from '../../../application/use-cases/material/update-material.usecase'
import type { UploadMaterialImageUseCase } from '../../../application/use-cases/material/upload-material-image.usecase'
import { withPermissions } from '../middlewares/permission.middleware'
import { rbac } from '../middlewares/rbac.middleware'

const parseContentJson = (contentJson: string | Record<string, unknown> | undefined): Record<string, unknown> | null => {
  if (!contentJson) {
    return null
  }

  if (typeof contentJson === 'object') {
    return contentJson
  }

  return JSON.parse(contentJson) as Record<string, unknown>
}

const parseBooleanString = (value: string | undefined): boolean => value === 'true'

export const createTeacherMaterialController = (
  authMiddleware: any,
  listTeacherMaterialsUseCase: ListTeacherMaterialsUseCase,
  getTeacherMaterialDetailUseCase: GetTeacherMaterialDetailUseCase,
  createMaterialUseCase: CreateMaterialUseCase,
  updateMaterialUseCase: UpdateMaterialUseCase,
  deleteMaterialUseCase: DeleteMaterialUseCase,
  uploadMaterialImageUseCase: UploadMaterialImageUseCase
) =>
  new Elysia({ prefix: '/api/teacher' })
    .use(authMiddleware)
    .use(rbac('TEACHER'))
    .get('/materials', withPermissions(['material.manage.own'], async ({ query, user }: any) => ({
      success: true,
      data: await listTeacherMaterialsUseCase.execute(user.id, user.branchId, query.moduleId),
      message: 'Daftar materi guru berhasil diambil'
    })), {
      query: TeacherMaterialsQueryDto
    })
    .get('/materials/:id', withPermissions(['material.manage.own'], async ({ params, user }: any) => ({
      success: true,
      data: await getTeacherMaterialDetailUseCase.execute(params.id, user.id),
      message: 'Detail materi guru berhasil diambil'
    })), {
      params: MaterialIdParamsDto
    })
    .post('/materials', withPermissions(['material.manage.own'], async ({ body, user }: any) => ({
      success: true,
      data: await createMaterialUseCase.execute({
        teacherId: user.id,
        branchId: user.branchId,
        moduleId: body.moduleId,
        title: body.title,
        summary: body.summary ?? null,
        materialType: body.materialType,
        contentJson: parseContentJson(body.contentJson),
        estimatedDurationMinutes: body.estimatedDurationMinutes ? Number(body.estimatedDurationMinutes) : null,
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        isPublished: parseBooleanString(body.isPublished),
        attachmentFile: body.attachmentFile
      }),
      message: 'Materi berhasil dibuat'
    })), {
      body: SaveMaterialDto
    })
    .patch('/materials/:id', withPermissions(['material.manage.own'], async ({ params, body, user }: any) => ({
      success: true,
      data: await updateMaterialUseCase.execute({
        materialId: params.id,
        teacherId: user.id,
        title: body.title,
        summary: body.summary ?? null,
        materialType: body.materialType,
        contentJson: parseContentJson(body.contentJson),
        estimatedDurationMinutes: body.estimatedDurationMinutes ? Number(body.estimatedDurationMinutes) : null,
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        isPublished: parseBooleanString(body.isPublished),
        attachmentFile: body.attachmentFile
      }),
      message: 'Materi berhasil diperbarui'
    })), {
      params: MaterialIdParamsDto,
      body: UpdateMaterialDto
    })
    .delete('/materials/:id', withPermissions(['material.manage.own'], async ({ params, user }: any) => ({
      success: true,
      data: await deleteMaterialUseCase.execute(params.id, user.id),
      message: 'Materi berhasil dihapus'
    })), {
      params: MaterialIdParamsDto
    })
    .post('/materials/assets/image', withPermissions(['material.manage.own'], async ({ body }) => ({
      success: true,
      data: await uploadMaterialImageUseCase.execute(body.file),
      message: 'Gambar materi berhasil diunggah'
    })), {
      body: UploadMaterialImageDto
    })
