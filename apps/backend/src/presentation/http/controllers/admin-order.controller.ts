/*
Tujuan: Menyediakan endpoint admin fase 2 untuk daftar dan verifikasi pembayaran order cabang dengan guard permission granular.
Caller: Frontend halaman `/admin/pembayaran`.
Dependensi: Auth middleware, RBAC admin, permission guard, DTO query/verifikasi, dan use case order admin.
Main Functions: Menampilkan order berdasarkan cabang/status dan memproses approve/reject pembayaran.
Side Effects: Membaca tabel orders serta menulis perubahan status order dan subscription saat approve.
*/

import { Elysia } from 'elysia'

import { AdminOrdersQueryDto, OrderIdParamsDto, VerifyOrderDto } from '../../../application/dto/package.dto'
import type { ListBranchOrdersUseCase } from '../../../application/use-cases/order/list-branch-orders.usecase'
import type { VerifyOrderUseCase } from '../../../application/use-cases/order/verify-order.usecase'
import { withPermissions } from '../middlewares/permission.middleware'
import { rbac } from '../middlewares/rbac.middleware'

export const createAdminOrderController = (
  authMiddleware: any,
  listBranchOrdersUseCase: ListBranchOrdersUseCase,
  verifyOrderUseCase: VerifyOrderUseCase
) =>
  new Elysia({ prefix: '/api/admin' })
    .use(authMiddleware)
    .use(rbac('BRANCH_ADMIN', 'SUPER_ADMIN'))
    .get('/orders', withPermissions(['order.branch.view'], async ({ query, user }: any) => ({
      success: true,
      data: await listBranchOrdersUseCase.execute({
        role: user.role,
        branchId: user.branchId,
        status: query.status
      }),
      message: 'Daftar order cabang berhasil diambil'
    })), {
      query: AdminOrdersQueryDto
    })
    .patch('/orders/:id/verify', withPermissions(['order.verify'], async ({ params, body, user }: any) => ({
      success: true,
      data: await verifyOrderUseCase.execute({
        orderId: params.id,
        action: body.action,
        note: body.note,
        actor: {
          id: user.id,
          role: user.role,
          branchId: user.branchId
        }
      }),
      message: body.action === 'APPROVE'
        ? 'Pembayaran berhasil disetujui'
        : 'Pembayaran berhasil ditolak'
    })), {
      params: OrderIdParamsDto,
      body: VerifyOrderDto
    })
