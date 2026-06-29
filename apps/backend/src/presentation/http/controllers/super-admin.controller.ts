/*
Tujuan: Menyediakan endpoint administrasi global fase 7 untuk Super Admin (CRUD Cabang, Pengguna, Paket, Kurikulum, Materi, Ujian, Laporan, Settings, dan Audit Logs).
Caller: Bootstrap backend.
Dependensi: Auth middleware, permission guard, DTO material/exam/superadmin, dan use cases terkait.
Main Functions: Menyediakan route secure `/api/superadmin/*` dengan validation body & parameters.
Side Effects: Membaca/menulis database sesuai use case.
*/

import { Elysia, t } from 'elysia'

import {
  CreateBranchDto,
  UpdateBranchDto,
  CreateUserDto,
  UpdateUserDto,
  CreatePackageDto,
  UpdatePackageDto,
  CreatePackageFeatureDto,
  UpdatePackageFeatureDto,
  AssignPackageSubjectsDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateModuleDto,
  UpdateModuleDto,
  UpdateSettingsDto
} from '../../../application/dto/superadmin.dto'

// Branches Use Cases
import type { ListAllBranchesUseCase } from '../../../application/use-cases/branch/list-all-branches.usecase'
import type { CreateBranchUseCase } from '../../../application/use-cases/branch/create-branch.usecase'
import type { UpdateBranchUseCase } from '../../../application/use-cases/branch/update-branch.usecase'
import type { DeleteBranchUseCase } from '../../../application/use-cases/branch/delete-branch.usecase'

// Users Use Cases
import type { ListUsersUseCase } from '../../../application/use-cases/user/list-users.usecase'
import type { CreateUserUseCase } from '../../../application/use-cases/user/create-user.usecase'
import type { UpdateUserUseCase } from '../../../application/use-cases/user/update-user.usecase'
import type { DeleteUserUseCase } from '../../../application/use-cases/user/delete-user.usecase'

// Packages Use Cases
import type { ListAllPackagesUseCase } from '../../../application/use-cases/package/list-all-packages.usecase'
import type { CreatePackageUseCase } from '../../../application/use-cases/package/create-package.usecase'
import type { UpdatePackageUseCase } from '../../../application/use-cases/package/update-package.usecase'
import type { DeletePackageUseCase } from '../../../application/use-cases/package/delete-package.usecase'
import type { ListPackageFeaturesUseCase } from '../../../application/use-cases/package/list-package-features.usecase'
import type { CreatePackageFeatureUseCase } from '../../../application/use-cases/package/create-package-feature.usecase'
import type { UpdatePackageFeatureUseCase } from '../../../application/use-cases/package/update-package-feature.usecase'
import type { DeletePackageFeatureUseCase } from '../../../application/use-cases/package/delete-package-feature.usecase'
import type { ListPackageSubjectsUseCase } from '../../../application/use-cases/package/list-package-subjects.usecase'
import type { AssignPackageSubjectsUseCase } from '../../../application/use-cases/package/assign-package-subjects.usecase'

// Curriculum Use Cases
import type { ListAllSubjectsUseCase } from '../../../application/use-cases/material/list-all-subjects.usecase'
import type { CreateSubjectUseCase } from '../../../application/use-cases/material/create-subject.usecase'
import type { UpdateSubjectUseCase } from '../../../application/use-cases/material/update-subject.usecase'
import type { DeleteSubjectUseCase } from '../../../application/use-cases/material/delete-subject.usecase'
import type { CreateModuleUseCase } from '../../../application/use-cases/material/create-module.usecase'
import type { UpdateModuleUseCase } from '../../../application/use-cases/material/update-module.usecase'
import type { DeleteModuleUseCase } from '../../../application/use-cases/material/delete-module.usecase'

// Reports & System Use Cases
import type { GetNationalStatsUseCase } from '../../../application/use-cases/admin/get-national-stats.usecase'
import type { ExportBranchReportUseCase } from '../../../application/use-cases/admin/export-branch-report.usecase'
import type { GetSystemSettingsUseCase } from '../../../application/use-cases/admin/get-system-settings.usecase'
import type { UpdateSystemSettingsUseCase } from '../../../application/use-cases/admin/update-system-settings.usecase'
import type { GetAuditLogsUseCase } from '../../../application/use-cases/admin/get-audit-logs.usecase'

// Superadmin Exam Management Use Cases
import type { SuperadminListExamsUseCase } from '../../../application/use-cases/superadmin/list-all-exams.usecase'
import type { SuperadminGetExamDetailUseCase } from '../../../application/use-cases/superadmin/get-exam-detail.usecase'
import type { SuperadminCreateQuestionUseCase } from '../../../application/use-cases/superadmin/create-question.usecase'
import type { SuperadminUpdateQuestionUseCase } from '../../../application/use-cases/superadmin/update-question.usecase'
import type { CreateExamUseCase } from '../../../application/use-cases/exam/create-exam.usecase'
import type { UpdateExamUseCase } from '../../../application/use-cases/exam/update-exam.usecase'
import type { DeleteExamUseCase } from '../../../application/use-cases/exam/delete-exam.usecase'

import {
  MaterialIdParamsDto,
  SaveMaterialDto,
  UpdateMaterialDto,
  UploadMaterialImageDto
} from '../../../application/dto/material.dto'

import type { CreateMaterialUseCase } from '../../../application/use-cases/material/create-material.usecase'
import type { UploadMaterialImageUseCase } from '../../../application/use-cases/material/upload-material-image.usecase'
import type { SuperadminListMaterialsUseCase } from '../../../application/use-cases/superadmin/list-materials.usecase'
import type { SuperadminGetMaterialDetailUseCase } from '../../../application/use-cases/superadmin/get-material-detail.usecase'
import type { SuperadminUpdateMaterialUseCase } from '../../../application/use-cases/superadmin/update-material.usecase'
import type { SuperadminDeleteMaterialUseCase } from '../../../application/use-cases/superadmin/delete-material.usecase'

import {
  CreateQuestionDto,
  ExamIdParamsDto,
  QuestionIdParamsDto,
  UpdateQuestionDto,
  CreateExamDto,
  ExamTypeDto
} from '../../../application/dto/exam.dto'

import { withPermissions } from '../middlewares/permission.middleware'

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

export const createSuperAdminController = (
  authMiddleware: any,
  // Branches
  listAllBranchesUseCase: ListAllBranchesUseCase,
  createBranchUseCase: CreateBranchUseCase,
  updateBranchUseCase: UpdateBranchUseCase,
  deleteBranchUseCase: DeleteBranchUseCase,
  // Users
  listUsersUseCase: ListUsersUseCase,
  createUserUseCase: CreateUserUseCase,
  updateUserUseCase: UpdateUserUseCase,
  deleteUserUseCase: DeleteUserUseCase,
  // Packages
  listAllPackagesUseCase: ListAllPackagesUseCase,
  createPackageUseCase: CreatePackageUseCase,
  updatePackageUseCase: UpdatePackageUseCase,
  deletePackageUseCase: DeletePackageUseCase,
  listPackageFeaturesUseCase: ListPackageFeaturesUseCase,
  createPackageFeatureUseCase: CreatePackageFeatureUseCase,
  updatePackageFeatureUseCase: UpdatePackageFeatureUseCase,
  deletePackageFeatureUseCase: DeletePackageFeatureUseCase,
  listPackageSubjectsUseCase: ListPackageSubjectsUseCase,
  assignPackageSubjectsUseCase: AssignPackageSubjectsUseCase,
  // Curriculum
  listAllSubjectsUseCase: ListAllSubjectsUseCase,
  createSubjectUseCase: CreateSubjectUseCase,
  updateSubjectUseCase: UpdateSubjectUseCase,
  deleteSubjectUseCase: DeleteSubjectUseCase,
  createModuleUseCase: CreateModuleUseCase,
  updateModuleUseCase: UpdateModuleUseCase,
  deleteModuleUseCase: DeleteModuleUseCase,
  // Stats, settings, audits
  getNationalStatsUseCase: GetNationalStatsUseCase,
  exportBranchReportUseCase: ExportBranchReportUseCase,
  getSystemSettingsUseCase: GetSystemSettingsUseCase,
  updateSystemSettingsUseCase: UpdateSystemSettingsUseCase,
  getAuditLogsUseCase: GetAuditLogsUseCase,
  superadminListMaterialsUseCase: SuperadminListMaterialsUseCase,
  superadminGetMaterialDetailUseCase: SuperadminGetMaterialDetailUseCase,
  createMaterialUseCase: CreateMaterialUseCase,
  superadminUpdateMaterialUseCase: SuperadminUpdateMaterialUseCase,
  superadminDeleteMaterialUseCase: SuperadminDeleteMaterialUseCase,
  uploadMaterialImageUseCase: UploadMaterialImageUseCase,
  superadminListExamsUseCase: SuperadminListExamsUseCase,
  superadminGetExamDetailUseCase: SuperadminGetExamDetailUseCase,
  superadminCreateQuestionUseCase: SuperadminCreateQuestionUseCase,
  superadminUpdateQuestionUseCase: SuperadminUpdateQuestionUseCase,
  createExamUseCase: CreateExamUseCase,
  updateExamUseCase: UpdateExamUseCase,
  deleteExamUseCase: DeleteExamUseCase
) =>
  new Elysia({ prefix: '/api/superadmin' })
    .use(authMiddleware)

    // ==========================================
    // 1. BRANCHES MANAGEMENT
    // ==========================================
    .get(
      '/branches',
      withPermissions(['branch.manage'], async () => {
        const data = await listAllBranchesUseCase.execute()
        return { success: true, data, message: 'Semua cabang berhasil diambil' }
      })
    )
    .post(
      '/branches',
      withPermissions(['branch.manage'], async ({ body }) => {
        const data = await createBranchUseCase.execute({
          name: body.name,
          code: body.code,
          address: body.address ?? null,
          city: body.city ?? null,
          phone: body.phone ?? null,
          isActive: body.isActive ?? true
        })
        return { success: true, data, message: 'Cabang berhasil dibuat' }
      }),
      { body: CreateBranchDto }
    )
    .patch(
      '/branches/:id',
      withPermissions(['branch.manage'], async ({ params, body }) => {
        const data = await updateBranchUseCase.execute({
          id: params.id,
          name: body.name,
          code: body.code,
          address: body.address,
          city: body.city,
          phone: body.phone,
          isActive: body.isActive
        })
        return { success: true, data, message: 'Cabang berhasil diperbarui' }
      }),
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: UpdateBranchDto
      }
    )
    .delete(
      '/branches/:id',
      withPermissions(['branch.manage'], async ({ params }) => {
        await deleteBranchUseCase.execute(params.id)
        return { success: true, message: 'Cabang berhasil dihapus' }
      }),
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    )

    // ==========================================
    // 2. USERS MANAGEMENT
    // ==========================================
    .get(
      '/users',
      withPermissions(['user.view.global'], async ({ query }) => {
        const data = await listUsersUseCase.execute({
          role: query.role as any,
          branchId: query.branchId,
          searchQuery: query.searchQuery,
          page: query.page,
          limit: query.limit
        })
        return { success: true, data, message: 'Semua pengguna berhasil diambil' }
      }),
      {
        query: t.Object({
          role: t.Optional(t.String()),
          branchId: t.Optional(t.String()),
          searchQuery: t.Optional(t.String()),
          page: t.Optional(t.Numeric()),
          limit: t.Optional(t.Numeric())
        })
      }
    )
    .post(
      '/users',
      withPermissions(['user.role.manage'], async ({ body }) => {
        const data = await createUserUseCase.execute({
          branchId: body.branchId ?? null,
          name: body.name,
          email: body.email,
          password: body.password,
          phone: body.phone ?? null,
          role: body.role
        })
        return { success: true, data, message: 'Pengguna berhasil dibuat' }
      }),
      { body: CreateUserDto }
    )
    .patch(
      '/users/:id',
      withPermissions(['user.update.global'], async ({ params, body }) => {
        const data = await updateUserUseCase.execute({
          id: params.id,
          branchId: body.branchId,
          name: body.name,
          email: body.email,
          phone: body.phone,
          role: body.role,
          isActive: body.isActive
        })
        return { success: true, data, message: 'Pengguna berhasil diperbarui' }
      }),
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: UpdateUserDto
      }
    )
    .delete(
      '/users/:id',
      withPermissions(['user.deactivate'], async ({ params }) => {
        await deleteUserUseCase.execute({ id: params.id })
        return { success: true, message: 'Pengguna berhasil dinonaktifkan/dihapus' }
      }),
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    )

    // ==========================================
    // 3. PACKAGES MANAGEMENT
    // ==========================================
    .get(
      '/packages',
      withPermissions(['package.manage'], async () => {
        const data = await listAllPackagesUseCase.execute()
        return { success: true, data, message: 'Semua paket berhasil diambil' }
      })
    )
    .post(
      '/packages',
      withPermissions(['package.manage'], async ({ body }) => {
        const data = await createPackageUseCase.execute({
          name: body.name,
          type: body.type,
          description: body.description ?? null,
          price: body.price,
          durationDays: body.durationDays,
          isActive: body.isActive ?? true,
          sortOrder: body.sortOrder ?? 0
        })
        return { success: true, data, message: 'Paket berhasil dibuat' }
      }),
      { body: CreatePackageDto }
    )
    .patch(
      '/packages/:id',
      withPermissions(['package.manage'], async ({ params, body }) => {
        const data = await updatePackageUseCase.execute({
          id: params.id,
          name: body.name,
          type: body.type,
          description: body.description,
          price: body.price,
          durationDays: body.durationDays,
          isActive: body.isActive,
          sortOrder: body.sortOrder
        })
        return { success: true, data, message: 'Paket berhasil diperbarui' }
      }),
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: UpdatePackageDto
      }
    )
    .delete(
      '/packages/:id',
      withPermissions(['package.manage'], async ({ params }) => {
        await deletePackageUseCase.execute(params.id)
        return { success: true, message: 'Paket berhasil dihapus' }
      }),
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    )

    .get(
      '/packages/:id/features',
      withPermissions(['package.manage'], async ({ params }) => {
        const data = await listPackageFeaturesUseCase.execute(params.id)
        return { success: true, data, message: 'Daftar fitur paket berhasil diambil' }
      }),
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    )
    .post(
      '/packages/:id/features',
      withPermissions(['package.manage'], async ({ params, body }) => {
        const data = await createPackageFeatureUseCase.execute({
          packageId: params.id,
          title: body.title,
          description: body.description ?? null,
          sortOrder: body.sortOrder ?? 0
        })
        return { success: true, data, message: 'Fitur paket berhasil ditambahkan' }
      }),
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: CreatePackageFeatureDto
      }
    )
    .patch(
      '/packages/features/:featureId',
      withPermissions(['package.manage'], async ({ params, body }) => {
        const data = await updatePackageFeatureUseCase.execute({
          id: params.featureId,
          title: body.title,
          description: body.description,
          sortOrder: body.sortOrder
        })
        return { success: true, data, message: 'Fitur paket berhasil diperbarui' }
      }),
      {
        params: t.Object({ featureId: t.String({ format: 'uuid' }) }),
        body: UpdatePackageFeatureDto
      }
    )
    .delete(
      '/packages/features/:featureId',
      withPermissions(['package.manage'], async ({ params }) => {
        await deletePackageFeatureUseCase.execute(params.featureId)
        return { success: true, message: 'Fitur paket berhasil dihapus' }
      }),
      { params: t.Object({ featureId: t.String({ format: 'uuid' }) }) }
    )

    // --- Package Curriculum Mapping ---
    .get(
      '/packages/:id/subjects',
      withPermissions(['package.manage'], async ({ params }) => {
        const data = await listPackageSubjectsUseCase.execute(params.id)
        return { success: true, data, message: 'Daftar mata pelajaran paket berhasil diambil' }
      }),
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    )
    .post(
      '/packages/:id/subjects',
      withPermissions(['package.manage'], async ({ params, body }) => {
        await assignPackageSubjectsUseCase.execute(params.id, body.subjectIds)
        return { success: true, message: 'Kurikulum paket berhasil disimpan' }
      }),
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: AssignPackageSubjectsDto
      }
    )


    // ==========================================
    // 4. CURRICULUM GLOBAL MANAGEMENT
    // ==========================================
    .get(
      '/subjects',
      withPermissions(['curriculum.manage'], async () => {
        const data = await listAllSubjectsUseCase.execute()
        return { success: true, data, message: 'Daftar semua mata pelajaran' }
      })
    )
    .post(
      '/subjects',
      withPermissions(['curriculum.manage'], async ({ body }) => {
        const data = await createSubjectUseCase.execute({
          name: body.name,
          description: body.description ?? null,
          sortOrder: body.sortOrder ?? 0,
          isActive: body.isActive ?? true,
          teacherIds: body.teacherIds ?? []
        })
        return { success: true, data, message: 'Mata pelajaran berhasil dibuat' }
      }),
      { body: CreateSubjectDto }
    )
    .patch(
      '/subjects/:id',
      withPermissions(['curriculum.manage'], async ({ params, body }) => {
        const data = await updateSubjectUseCase.execute({
          id: params.id,
          name: body.name,
          description: body.description,
          sortOrder: body.sortOrder,
          isActive: body.isActive,
          teacherIds: body.teacherIds
        })
        return { success: true, data, message: 'Mata pelajaran berhasil diperbarui' }
      }),
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: UpdateSubjectDto
      }
    )
    .delete(
      '/subjects/:id',
      withPermissions(['curriculum.manage'], async ({ params }) => {
        await deleteSubjectUseCase.execute(params.id)
        return { success: true, message: 'Mata pelajaran berhasil dihapus' }
      }),
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    )

    .post(
      '/modules',
      withPermissions(['curriculum.manage'], async ({ body }) => {
        const data = await createModuleUseCase.execute({
          subjectId: body.subjectId,
          title: body.title,
          description: body.description ?? null,
          sortOrder: body.sortOrder ?? 0,
          isActive: body.isActive ?? true
        })
        return { success: true, data, message: 'Modul berhasil dibuat' }
      }),
      { body: CreateModuleDto }
    )
    .patch(
      '/modules/:id',
      withPermissions(['curriculum.manage'], async ({ params, body }) => {
        const data = await updateModuleUseCase.execute({
          id: params.id,
          subjectId: body.subjectId,
          title: body.title,
          description: body.description,
          sortOrder: body.sortOrder,
          isActive: body.isActive
        })
        return { success: true, data, message: 'Modul berhasil diperbarui' }
      }),
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: UpdateModuleDto
      }
    )
    .delete(
      '/modules/:id',
      withPermissions(['curriculum.manage'], async ({ params }) => {
        await deleteModuleUseCase.execute(params.id)
        return { success: true, message: 'Modul berhasil dihapus' }
      }),
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    )

    // ==========================================
    // 4B. MATERIAL GLOBAL MANAGEMENT
    // ==========================================
    .get(
      '/materials',
      withPermissions(['material.manage.branch'], async ({ query }) => {
        const data = await superadminListMaterialsUseCase.execute({
          moduleId: query.moduleId,
          subjectId: query.subjectId,
          isPublished: query.isPublished === 'true' ? true : query.isPublished === 'false' ? false : undefined,
          searchQuery: query.q
        })
        return { success: true, data, message: 'Daftar semua materi berhasil diambil' }
      }),
      {
        query: t.Object({
          moduleId: t.Optional(t.String({ format: 'uuid' })),
          subjectId: t.Optional(t.String({ format: 'uuid' })),
          isPublished: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
          q: t.Optional(t.String({ maxLength: 120 }))
        })
      }
    )
    .get(
      '/materials/:id',
      withPermissions(['material.manage.branch'], async ({ params }) => {
        const data = await superadminGetMaterialDetailUseCase.execute(params.id)
        return { success: true, data, message: 'Detail materi berhasil diambil' }
      }),
      { params: MaterialIdParamsDto }
    )
    .post(
      '/materials',
      withPermissions(['material.manage.branch'], async ({ body, user }: any) => {
        const data = await createMaterialUseCase.execute({
          teacherId: user.id,
          branchId: user.branchId ?? null,
          moduleId: body.moduleId,
          title: body.title,
          summary: body.summary ?? null,
          materialType: body.materialType,
          contentJson: parseContentJson(body.contentJson),
          estimatedDurationMinutes: body.estimatedDurationMinutes ? Number(body.estimatedDurationMinutes) : null,
          sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
          isPublished: parseBooleanString(body.isPublished),
          attachmentFile: body.attachmentFile,
          enforceTeacherPic: false
        })
        return { success: true, data, message: 'Materi berhasil dibuat oleh admin' }
      }),
      { body: SaveMaterialDto }
    )
    .patch(
      '/materials/:id',
      withPermissions(['material.manage.branch'], async ({ params, body }) => {
        const data = await superadminUpdateMaterialUseCase.execute({
          materialId: params.id,
          title: body.title,
          summary: body.summary ?? null,
          materialType: body.materialType,
          contentJson: parseContentJson(body.contentJson),
          estimatedDurationMinutes: body.estimatedDurationMinutes ? Number(body.estimatedDurationMinutes) : null,
          sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
          isPublished: parseBooleanString(body.isPublished),
          attachmentFile: body.attachmentFile
        })
        return { success: true, data, message: 'Materi berhasil diperbarui oleh admin' }
      }),
      {
        params: MaterialIdParamsDto,
        body: UpdateMaterialDto
      }
    )
    .delete(
      '/materials/:id',
      withPermissions(['material.manage.branch'], async ({ params }) => {
        const data = await superadminDeleteMaterialUseCase.execute(params.id)
        return { success: true, data, message: 'Materi berhasil dihapus' }
      }),
      { params: MaterialIdParamsDto }
    )
    .post(
      '/materials/assets/image',
      withPermissions(['material.manage.branch'], async ({ body }) => {
        const data = await uploadMaterialImageUseCase.execute(body.file)
        return { success: true, data, message: 'Gambar materi berhasil diunggah' }
      }),
      { body: UploadMaterialImageDto }
    )

    // ==========================================
    // 5. REPORTS & SYSTEM OPERATIONS
    // ==========================================
    .get(
      '/reports/stats',
      withPermissions(['report.global.view'], async () => {
        const data = await getNationalStatsUseCase.execute()
        return { success: true, data, message: 'Statistik nasional berhasil diambil' }
      })
    )
    .get(
      '/reports/export',
      withPermissions(['report.global.view'], async ({ set }) => {
        const { csv, filename } = await exportBranchReportUseCase.execute({ branchId: null })
        set.headers['content-type'] = 'text/csv; charset=utf-8'
        set.headers['content-disposition'] = `attachment; filename="${filename}"`
        return csv
      })
    )
    .get(
      '/settings/:key',
      withPermissions(['settings.manage'], async ({ params }) => {
        const data = await getSystemSettingsUseCase.execute(params.key)
        return { success: true, data, message: 'Pengaturan berhasil diambil' }
      }),
      { params: t.Object({ key: t.String() }) }
    )
    .post(
      '/settings',
      withPermissions(['settings.manage'], async ({ body }) => {
        await updateSystemSettingsUseCase.execute({
          key: body.key,
          value: body.value
        })
        return { success: true, message: 'Pengaturan berhasil disimpan' }
      }),
      { body: UpdateSettingsDto }
    )
    .get(
      '/audit-logs',
      withPermissions(['audit_log.view'], async ({ query }) => {
        const data = await getAuditLogsUseCase.execute({ limit: query.limit ?? 50 })
        return { success: true, data, message: 'Audit logs berhasil diambil' }
      }),
      {
        query: t.Object({
          limit: t.Optional(t.Numeric())
        })
      }
    )
    .get(
      '/exams',
      withPermissions(['exam.view'], async () => {
        const data = await superadminListExamsUseCase.execute()
        return { success: true, data, message: 'Daftar semua ujian berhasil diambil' }
      })
    )
    .get(
      '/exams/:id',
      withPermissions(['exam.view'], async ({ params }) => {
        const data = await superadminGetExamDetailUseCase.execute(params.id)
        return { success: true, data, message: 'Detail ujian berhasil diambil' }
      }),
      { params: ExamIdParamsDto }
    )
    .post(
      '/exams/:id/questions',
      withPermissions(['question.manage'], async ({ params, body }) => {
        const data = await superadminCreateQuestionUseCase.execute({
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
        })
        return { success: true, data, message: 'Soal berhasil ditambahkan' }
      }),
      {
        params: ExamIdParamsDto,
        body: CreateQuestionDto
      }
    )
    .patch(
      '/questions/:id',
      withPermissions(['question.manage'], async ({ params, body }) => {
        const data = await superadminUpdateQuestionUseCase.execute({
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
        })
        return { success: true, data, message: 'Soal berhasil diperbarui' }
      }),
      {
        params: QuestionIdParamsDto,
        body: UpdateQuestionDto
      }
    )
    .post(
      '/exams',
      withPermissions(['exam.manage.branch'], async ({ body, user }: any) => {
        const data = await createExamUseCase.execute({
          teacherId: user.id,
          branchId: body.branchId ?? null,
          subjectId: body.subjectId ?? null,
          title: body.title,
          description: body.description ?? null,
          instructions: body.instructions ?? null,
          examType: body.examType,
          durationMinutes: Number(body.durationMinutes),
          startsAt: new Date(body.startsAt),
          endsAt: new Date(body.endsAt),
          isPublished: body.isPublished
        })
        return { success: true, data, message: 'Ujian berhasil dibuat oleh admin' }
      }),
      {
        body: t.Object({
          branchId: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
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
      }
    )
    .patch(
      '/exams/:id',
      withPermissions(['exam.manage.branch'], async ({ params, body, user }: any) => {
        const data = await updateExamUseCase.execute({
          examId: params.id,
          userId: user.id,
          role: 'SUPERADMIN',
          branchId: body.branchId ?? null,
          subjectId: body.subjectId ?? null,
          title: body.title,
          description: body.description ?? null,
          instructions: body.instructions ?? null,
          examType: body.examType,
          durationMinutes: Number(body.durationMinutes),
          startsAt: new Date(body.startsAt),
          endsAt: new Date(body.endsAt),
          isPublished: body.isPublished
        })
        return { success: true, data, message: 'Ujian berhasil diperbarui oleh admin' }
      }),
      {
        params: ExamIdParamsDto,
        body: t.Object({
          branchId: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
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
      }
    )
    .delete(
      '/exams/:id',
      withPermissions(['exam.manage.branch'], async ({ params, user }: any) => {
        await deleteExamUseCase.execute({
          examId: params.id,
          userId: user.id,
          role: 'SUPERADMIN'
        })
        return { success: true, message: 'Ujian berhasil dihapus' }
      }),
      {
        params: ExamIdParamsDto
      }
    )
