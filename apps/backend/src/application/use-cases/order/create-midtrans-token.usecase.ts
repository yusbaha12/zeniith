/*
Tujuan: Menyediakan use case pembuatan Midtrans Snap token untuk order PENDING agar murid dapat membayar via QRIS/Virtual Account.
Caller: PaymentGatewayController endpoint POST /api/orders/:id/midtrans-token.
Dependensi: DB transaction, order/package repository, user repository (untuk data customer), dan MidtransService.
Main Functions: Validasi order milik murid, buat Snap token, simpan token ke DB, kembalikan token + client key.
Side Effects: HTTP call ke Midtrans API, update kolom midtrans_snap_token di tabel orders.
*/

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IOrderRepository } from '../../../domain/repositories/order.repository'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'
import { MidtransService } from '../../services/midtrans.service'
import type { AppConfig } from '../../services/config.service'
import { AppError, ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'

interface CreateMidtransTokenInput {
  orderId: string
  userId: string
  customerName: string
  customerEmail: string
}

export class CreateMidtransTokenUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly orderRepository: IOrderRepository,
    private readonly packageRepository: IPackageRepository,
    private readonly midtransService: MidtransService,
    private readonly config: AppConfig
  ) {}

  async execute(input: CreateMidtransTokenInput) {
    const order = await this.orderRepository.findById(input.orderId)

    if (!order) {
      throw new NotFoundError('Order')
    }

    if (order.userId !== input.userId) {
      throw new ForbiddenError('Order bukan milik Anda')
    }

    if (!order.isPending()) {
      throw new AppError('Order ini sudah tidak dalam status menunggu pembayaran', 422, 'ORDER_NOT_PENDING')
    }

    if (!order.isGatewayOrder()) {
      throw new AppError('Metode pembayaran ini tidak mendukung Midtrans Snap', 422, 'PAYMENT_METHOD_NOT_GATEWAY')
    }

    const packageItem = await this.packageRepository.findById(order.packageId)

    if (!packageItem) {
      throw new NotFoundError('Paket belajar')
    }

    // Gunakan order.orderCode sebagai Midtrans order_id agar webhook bisa lookup
    const snapResult = await this.midtransService.createSnapToken({
      orderId: order.orderCode,
      grossAmount: order.amount.amount,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      itemName: packageItem.name
    })

    // Simpan snap token ke DB tanpa mengubah status (masih PENDING)
    await this.database.transaction(async (transaction) =>
      this.orderRepository.updateMidtransData(order.id, {
        midtransSnapToken: snapResult.token
      }, transaction)
    )

    return {
      snapToken: snapResult.token,
      clientKey: this.config.midtransClientKey,
      orderCode: order.orderCode,
      amount: order.amount.amount,
      amountLabel: packageItem.price.formatRupiah()
    }
  }
}
