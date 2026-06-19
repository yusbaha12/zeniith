/*
Tujuan: Menyediakan endpoint administrasi cabang fase 7 (statistik cabang, export laporan, dan CRUD murid lokal cabang).
Caller: Bootstrap backend.
Dependensi: Auth middleware, permission guard, userRepository, dan use cases terkait.
Main Functions: Menyediakan route secure `/api/admin` dengan validation body & parameters.
Side Effects: Membaca/menulis database sesuai use case.
*/

import { Elysia, t } from 'elysia'

import { AppError } from '../../../shared/errors/app.error'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import type { GetBranchStatsUseCase } from '../../../application/use-cases/admin/get-branch-stats.usecase'
import type { ExportBranchReportUseCase } from '../../../application/use-cases/admin/export-branch-report.usecase'
import type { ListUsersUseCase } from '../../../application/use-cases/user/list-users.usecase'
import type { CreateUserUseCase } from '../../../application/use-cases/user/create-user.usecase'
import type { UpdateUserUseCase } from '../../../application/use-cases/user/update-user.usecase'
import type { DeleteUserUseCase } from '../../../application/use-cases/user/delete-user.usecase'
import { withPermissions } from '../middlewares/permission.middleware'

export const createBranchAdminController = (
  authMiddleware: any,
  userRepository: IUserRepository,
  getBranchStatsUseCase: GetBranchStatsUseCase,
  exportBranchReportUseCase: ExportBranchReportUseCase,
  listUsersUseCase: ListUsersUseCase,
  createUserUseCase: CreateUserUseCase,
  updateUserUseCase: UpdateUserUseCase,
  deleteUserUseCase: DeleteUserUseCase
) =>
  new Elysia({ prefix: '/api/admin' })
    .use(authMiddleware)
    // 1. Statistik Cabang
    .get(
      '/stats',
      withPermissions(['report.branch.view'], async ({ user }) => {
        if (!user.branchId) {
          throw new AppError('User tidak terasosiasi dengan cabang manapun', 400, 'USER_NO_BRANCH')
        }
        const data = await getBranchStatsUseCase.execute({ branchId: user.branchId })
        return {
          success: true,
          data,
          message: 'Statistik cabang berhasil diambil'
        }
      })
    )
    // 2. Export Laporan Cabang
    .get(
      '/reports/export',
      withPermissions(['report.branch.view'], async ({ user, set }) => {
        if (!user.branchId) {
          throw new AppError('User tidak terasosiasi dengan cabang manapun', 400, 'USER_NO_BRANCH')
        }
        const { csv, filename } = await exportBranchReportUseCase.execute({ branchId: user.branchId })
        set.headers['content-type'] = 'text/csv; charset=utf-8'
        set.headers['content-disposition'] = `attachment; filename="${filename}"`
        return csv
      })
    )
    // 3. List Murid Cabang
    .get(
      '/students',
      withPermissions(['user.view.branch'], async ({ user, query }) => {
        if (!user.branchId) {
          throw new AppError('User tidak terasosiasi dengan cabang manapun', 400, 'USER_NO_BRANCH')
        }
        const data = await listUsersUseCase.execute({
          role: 'STUDENT',
          branchId: user.branchId,
          searchQuery: query.searchQuery,
          page: query.page,
          limit: query.limit
        })
        return {
          success: true,
          data,
          message: 'Daftar murid cabang berhasil diambil'
        }
      }),
      {
        query: t.Object({
          searchQuery: t.Optional(t.String()),
          page: t.Optional(t.Numeric()),
          limit: t.Optional(t.Numeric())
        })
      }
    )
    // 4. Create Murid Cabang
    .post(
      '/students',
      withPermissions(['user.create.student'], async ({ user, body }) => {
        if (!user.branchId) {
          throw new AppError('User tidak terasosiasi dengan cabang manapun', 400, 'USER_NO_BRANCH')
        }
        const data = await createUserUseCase.execute({
          branchId: user.branchId,
          name: body.name,
          email: body.email,
          password: body.password,
          phone: body.phone ?? null,
          role: 'STUDENT'
        })
        return {
          success: true,
          data,
          message: 'Murid cabang berhasil didaftarkan'
        }
      }),
      {
        body: t.Object({
          name: t.String({ minLength: 2 }),
          email: t.String({ format: 'email' }),
          password: t.String({ minLength: 8 }),
          phone: t.Optional(t.String())
        })
      }
    )
    // 5. Update Murid Cabang
    .patch(
      '/students/:id',
      withPermissions(['user.update.branch'], async ({ user, params, body }) => {
        if (!user.branchId) {
          throw new AppError('User tidak terasosiasi dengan cabang manapun', 400, 'USER_NO_BRANCH')
        }
        const student = await userRepository.findById(params.id)
        if (!student || student.branchId !== user.branchId || student.role !== 'STUDENT') {
          throw new AppError('Murid tidak ditemukan di cabang Anda', 404, 'STUDENT_NOT_FOUND')
        }
        const data = await updateUserUseCase.execute({
          id: params.id,
          name: body.name,
          email: body.email,
          phone: body.phone,
          password: body.password,
          isActive: body.isActive
        })
        return {
          success: true,
          data,
          message: 'Murid cabang berhasil diperbarui'
        }
      }),
      {
        params: t.Object({
          id: t.String({ format: 'uuid' })
        }),
        body: t.Object({
          name: t.Optional(t.String({ minLength: 2 })),
          email: t.Optional(t.String({ format: 'email' })),
          phone: t.Optional(t.String()),
          password: t.Optional(t.String()),
          isActive: t.Optional(t.Boolean())
        })
      }
    )
    // 6. Delete/Deactivate Murid Cabang
    .delete(
      '/students/:id',
      withPermissions(['user.deactivate'], async ({ user, params }) => {
        if (!user.branchId) {
          throw new AppError('User tidak terasosiasi dengan cabang manapun', 400, 'USER_NO_BRANCH')
        }
        const student = await userRepository.findById(params.id)
        if (!student || student.branchId !== user.branchId || student.role !== 'STUDENT') {
          throw new AppError('Murid tidak ditemukan di cabang Anda', 404, 'STUDENT_NOT_FOUND')
        }
        await deleteUserUseCase.execute({ id: params.id })
        return {
          success: true,
          message: 'Murid cabang berhasil dinonaktifkan/dihapus'
        }
      }),
      {
        params: t.Object({
          id: t.String({ format: 'uuid' })
        })
      }
    )
