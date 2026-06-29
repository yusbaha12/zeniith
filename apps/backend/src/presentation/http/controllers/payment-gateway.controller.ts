/*
Tujuan: Menyediakan endpoint payment gateway untuk Midtrans Snap token dan webhook notification handler.
Caller: Frontend murid (snap token), Midtrans server (webhook), dan murid (polling status).
Dependensi: Auth middleware, RBAC student, use case Midtrans, dan use case status order.
Main Functions: POST /snap-token (buat token), POST /midtrans/notification (webhook), GET /status (polling).
Side Effects: Update tabel orders, membuat subscription, HTTP call ke Midtrans API.
*/

import { Elysia, t } from 'elysia'

import type { CreateMidtransTokenUseCase } from '../../../application/use-cases/order/create-midtrans-token.usecase'
import type { HandleMidtransNotificationUseCase } from '../../../application/use-cases/order/handle-midtrans-notification.usecase'
import type { GetOrderStatusUseCase } from '../../../application/use-cases/order/get-order-status.usecase'
import { withPermissions } from '../middlewares/permission.middleware'
import { rbac } from '../middlewares/rbac.middleware'
import { logger } from '../../../shared/utils/logger.util'

const MidtransNotificationDto = t.Object({
  order_id: t.String(),
  transaction_id: t.String(),
  transaction_status: t.String(),
  payment_type: t.String(),
  gross_amount: t.String(),
  status_code: t.String(),
  signature_key: t.String(),
  fraud_status: t.Optional(t.String())
})

const SnapTokenParamsDto = t.Object({ id: t.String() })
const OrderStatusParamsDto = t.Object({ id: t.String() })

export const createPaymentGatewayController = (
  authMiddleware: any,
  createMidtransTokenUseCase: CreateMidtransTokenUseCase,
  handleMidtransNotificationUseCase: HandleMidtransNotificationUseCase,
  getOrderStatusUseCase: GetOrderStatusUseCase
) =>
  new Elysia({ prefix: '/api' })
    // ─── Endpoint murid: minta Snap token (perlu auth) ───────────────────
    .use(authMiddleware)
    .post(
      '/orders/:id/midtrans-token',
      withPermissions(['order.create'], async ({ params, user }: any) => ({
        success: true,
        data: await createMidtransTokenUseCase.execute({
          orderId: params.id,
          userId: user.id,
          customerName: user.name ?? user.email,
          customerEmail: user.email
        }),
        message: 'Snap token berhasil dibuat'
      })),
      { params: SnapTokenParamsDto }
    )
    // ─── Endpoint murid: polling status order (perlu auth) ───────────────
    .use(rbac('STUDENT'))
    .get(
      '/orders/:id/status',
      withPermissions(['order.self.view'], async ({ params, user }: any) => ({
        success: true,
        data: await getOrderStatusUseCase.execute({
          orderId: params.id,
          userId: user.id
        }),
        message: 'Status order berhasil diambil'
      })),
      { params: OrderStatusParamsDto }
    )

// ─── Webhook Midtrans: TIDAK perlu auth, verifikasi via signature ─────────
// Dibuat terpisah agar tidak terkena auth middleware
export const createMidtransWebhookController = (
  handleMidtransNotificationUseCase: HandleMidtransNotificationUseCase
) =>
  new Elysia({ prefix: '/api/payments' })
    .post(
      '/midtrans/notification',
      async ({ body, set }: any) => {
        try {
          const result = await handleMidtransNotificationUseCase.execute(body)
          set.status = 200
          return { success: true, ...result }
        } catch (error) {
          logger.error('Midtrans notification error', {
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          // Selalu return 200 agar Midtrans tidak retry — error sudah dilog
          set.status = 200
          return { success: false, message: 'Notification received but failed to process' }
        }
      },
      { body: MidtransNotificationDto }
    )
