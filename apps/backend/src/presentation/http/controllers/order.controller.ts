/*
Tujuan: Menyediakan endpoint order fase 2 untuk checkout murid dan riwayat pembelian pribadi dengan guard permission granular.
Caller: Frontend checkout paket dan halaman riwayat order murid.
Dependensi: Auth middleware, RBAC student, permission guard, DTO order, dan use case order/subscription.
Main Functions: Membuat order pembelian, menampilkan riwayat order murid, dan menampilkan subscription aktif.
Side Effects: Menulis tabel orders, membaca orders/subscriptions, dan dapat upload object bukti transfer.
*/

import { Elysia } from 'elysia'

import { CreateOrderDto } from '../../../application/dto/package.dto'
import type { ListMyOrdersUseCase } from '../../../application/use-cases/order/list-my-orders.usecase'
import type { PurchasePackageUseCase } from '../../../application/use-cases/order/purchase-package.usecase'
import type { GetActiveSubscriptionUseCase } from '../../../application/use-cases/subscription/get-active-subscription.usecase'
import { withPermissions } from '../middlewares/permission.middleware'
import { rbac } from '../middlewares/rbac.middleware'

export const createOrderController = (
  authMiddleware: any,
  purchasePackageUseCase: PurchasePackageUseCase,
  listMyOrdersUseCase: ListMyOrdersUseCase,
  getActiveSubscriptionUseCase: GetActiveSubscriptionUseCase
) =>
  new Elysia({ prefix: '/api' })
    .use(authMiddleware)
    .use(rbac('STUDENT'))
    .post('/orders', withPermissions(['order.create'], async ({ body, user }: any) => ({
      success: true,
      data: await purchasePackageUseCase.execute({
        userId: user.id,
        branchId: user.branchId,
        packageId: body.packageId,
        paymentMethod: body.paymentMethod,
        note: body.note,
        proofFile: body.proofFile
      }),
      message: 'Order pembelian berhasil dibuat'
    })), {
      body: CreateOrderDto
    })
    .get('/orders/my', withPermissions(['order.self.view'], async ({ user }: any) => ({
      success: true,
      data: await listMyOrdersUseCase.execute(user.id),
      message: 'Riwayat order berhasil diambil'
    })))
    .get('/subscriptions/me/active', withPermissions(['order.self.view'], async ({ user }: any) => ({
      success: true,
      data: await getActiveSubscriptionUseCase.execute(user.id),
      message: 'Status langganan aktif berhasil diambil'
    })))
