/*
Tujuan: Menyediakan use case verifikasi pembayaran fase 2 untuk admin cabang.
Caller: Admin order controller.
Dependensi: DB transaction, order/package/subscription repository, dan payment service.
Main Functions: Mengubah status order, membuat atau memperbarui akses subscription, dan menjaga konsistensi transaksi.
Side Effects: Membaca tabel orders/packages/subscriptions dan menulis perubahan status + subscription pada PostgreSQL.
*/

import type { Role } from '@lms-bimbel/shared'

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IOrderRepository } from '../../../domain/repositories/order.repository'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'
import type { ISubscriptionRepository } from '../../../domain/repositories/subscription.repository'
import { AppError, ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import { PaymentService } from '../../services/payment.service'

interface VerifyOrderInput {
  orderId: string
  action: 'APPROVE' | 'REJECT'
  note?: string | null
  actor: {
    id: string
    role: Role
    branchId: string | null
  }
}

export class VerifyOrderUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly orderRepository: IOrderRepository,
    private readonly packageRepository: IPackageRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly paymentService: PaymentService
  ) {}

  async execute(input: VerifyOrderInput) {
    const order = await this.orderRepository.findById(input.orderId)

    if (!order) {
      throw new NotFoundError('Order')
    }

    if (!order.canBeVerified()) {
      throw new AppError('Order ini sudah diverifikasi sebelumnya', 422, 'ORDER_NOT_PENDING')
    }

    if (input.actor.role !== 'SUPER_ADMIN' && input.actor.branchId !== order.branchId) {
      throw new ForbiddenError('Order ini berada di luar cabang Anda')
    }

    if (input.action === 'REJECT') {
      await this.database.transaction(async (transaction) => {
        await this.orderRepository.updateVerification(order.id, {
          status: 'REJECTED',
          verificationNote: input.note ?? null,
          verifiedBy: input.actor.id,
          verifiedAt: new Date()
        }, transaction)
      })

      return {
        id: order.id,
        status: 'REJECTED' as const
      }
    }

    const packageItem = await this.packageRepository.findById(order.packageId)

    if (!packageItem) {
      throw new NotFoundError('Paket belajar')
    }

    const activeSubscription = await this.subscriptionRepository.findCurrentByUserId(order.userId)
    const { startsAt, endsAt } = this.paymentService.calculateSubscriptionWindow(
      packageItem.durationDays,
      activeSubscription?.endsAt ?? null
    )

    await this.database.transaction(async (transaction) => {
      await this.orderRepository.updateVerification(order.id, {
        status: 'PAID',
        verificationNote: input.note ?? null,
        verifiedBy: input.actor.id,
        verifiedAt: new Date()
      }, transaction)

      await this.subscriptionRepository.deactivateActiveByUserId(order.userId, transaction)
      await this.subscriptionRepository.create({
        userId: order.userId,
        branchId: order.branchId,
        packageId: order.packageId,
        orderId: order.id,
        startsAt,
        endsAt,
        isActive: true
      }, transaction)
    })

    return {
      id: order.id,
      status: 'PAID' as const,
      startsAt,
      endsAt
    }
  }
}
