/*
Tujuan: Menyediakan use case pemrosesan notifikasi webhook Midtrans secara otomatis untuk mengubah status order PENDING menjadi PAID/FAILED dan membuat subscription aktif.
Caller: PaymentGatewayController endpoint POST /api/payments/midtrans/notification.
Dependensi: DB transaction, order/package/subscription repository, MidtransService, PaymentService.
Main Functions: Verifikasi signature, parse status, update order, buat subscription bila SUCCESS.
Side Effects: Membaca/menulis tabel orders dan subscriptions dalam satu transaksi atomik.
*/

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IOrderRepository } from '../../../domain/repositories/order.repository'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'
import type { ISubscriptionRepository } from '../../../domain/repositories/subscription.repository'
import type { MidtransNotificationPayload } from '../../services/midtrans.service'
import { MidtransService } from '../../services/midtrans.service'
import { PaymentService } from '../../services/payment.service'
import { AppError } from '../../../shared/errors/app.error'
import { logger } from '../../../shared/utils/logger.util'

export class HandleMidtransNotificationUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly orderRepository: IOrderRepository,
    private readonly packageRepository: IPackageRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly midtransService: MidtransService,
    private readonly paymentService: PaymentService
  ) {}

  async execute(payload: MidtransNotificationPayload): Promise<{ processed: boolean; status: string }> {
    // 1. Verifikasi signature — tolak bila tidak valid (security)
    const isValid = this.midtransService.verifyNotificationSignature(payload)

    if (!isValid) {
      throw new AppError('Signature notifikasi Midtrans tidak valid', 401, 'MIDTRANS_INVALID_SIGNATURE')
    }

    const paymentStatus = this.midtransService.parseNotificationStatus(payload)

    logger.info('Midtrans notification received', {
      orderId: payload.order_id,
      transactionId: payload.transaction_id,
      transactionStatus: payload.transaction_status,
      paymentStatus
    })

    // 2. Lookup order berdasarkan orderCode (= Midtrans order_id)
    // Coba cari via midtransTransactionId dulu, fallback via orderCode di findById tidak ada
    // Kita simpan orderCode di orders.orderCode dan gunakan sebagai Midtrans order_id
    const ordersByCode = await this.orderRepository.listAll()
    const orderListItem = ordersByCode.find(o => o.orderCode === payload.order_id)

    if (!orderListItem) {
      logger.warn('Order tidak ditemukan untuk notifikasi Midtrans', { midtransOrderId: payload.order_id })
      // Kembalikan 200 agar Midtrans tidak retry terus-menerus
      return { processed: false, status: 'ORDER_NOT_FOUND' }
    }

    const order = await this.orderRepository.findById(orderListItem.id)

    if (!order) {
      return { processed: false, status: 'ORDER_NOT_FOUND' }
    }

    // 3. Idempotency: sudah PAID/REJECTED? Abaikan
    if (!order.isPending()) {
      logger.info('Notifikasi Midtrans diabaikan karena order sudah diproses', {
        orderId: order.id,
        currentStatus: order.status
      })
      return { processed: false, status: 'ALREADY_PROCESSED' }
    }

    // 4. Proses berdasarkan payment status
    if (paymentStatus === 'SUCCESS') {
      await this.handleSuccess(order.id, order.userId, order.branchId, order.packageId, payload)
      return { processed: true, status: 'PAID' }
    }

    if (paymentStatus === 'FAILED' || paymentStatus === 'CANCEL') {
      await this.database.transaction(async (transaction) => {
        await this.orderRepository.updateMidtransData(order.id, {
          midtransTransactionId: payload.transaction_id,
          midtransPaymentType: payload.payment_type,
          status: 'REJECTED',
          verifiedAt: new Date()
        }, transaction)
      })
      return { processed: true, status: 'REJECTED' }
    }

    if (paymentStatus === 'EXPIRED') {
      await this.database.transaction(async (transaction) => {
        await this.orderRepository.updateMidtransData(order.id, {
          midtransTransactionId: payload.transaction_id,
          midtransPaymentType: payload.payment_type,
          status: 'EXPIRED',
          verifiedAt: new Date()
        }, transaction)
      })
      return { processed: true, status: 'EXPIRED' }
    }

    // PENDING — update transaction id saja, tunggu notifikasi berikutnya
    await this.orderRepository.updateMidtransData(order.id, {
      midtransTransactionId: payload.transaction_id,
      midtransPaymentType: payload.payment_type
    })

    return { processed: false, status: 'PENDING' }
  }

  private async handleSuccess(
    orderId: string,
    userId: string,
    branchId: string | null,
    packageId: string,
    payload: MidtransNotificationPayload
  ): Promise<void> {
    const packageItem = await this.packageRepository.findById(packageId)

    if (!packageItem) {
      throw new AppError('Paket belajar tidak ditemukan saat memproses pembayaran berhasil', 500, 'PACKAGE_NOT_FOUND')
    }

    const activeSubscription = await this.subscriptionRepository.findCurrentByUserId(userId)
    const { startsAt, endsAt } = this.paymentService.calculateSubscriptionWindow(
      packageItem.durationDays,
      activeSubscription?.endsAt ?? null
    )

    await this.database.transaction(async (transaction) => {
      await this.orderRepository.updateMidtransData(orderId, {
        midtransTransactionId: payload.transaction_id,
        midtransPaymentType: payload.payment_type,
        status: 'PAID',
        verifiedAt: new Date()
      }, transaction)

      await this.subscriptionRepository.deactivateActiveByUserId(userId, transaction)

      await this.subscriptionRepository.create({
        userId,
        branchId,
        packageId,
        orderId,
        startsAt,
        endsAt,
        isActive: true
      }, transaction)
    })
  }
}
