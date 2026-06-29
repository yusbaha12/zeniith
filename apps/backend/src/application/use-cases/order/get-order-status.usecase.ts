/*
Tujuan: Menyediakan use case polling status order murid beserta snap token dan instruksi bayar.
Caller: PaymentGatewayController endpoint GET /api/orders/:id/status.
Dependensi: Order repository, ObjectStorageService untuk presigned URL bukti.
Main Functions: Ambil detail order milik murid, sertakan snap token bila ada dan instruksi bayar.
Side Effects: Membaca tabel orders dan packages. Tidak ada write.
*/

import type { IOrderRepository } from '../../../domain/repositories/order.repository'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'

interface GetOrderStatusInput {
  orderId: string
  userId: string
}

export class GetOrderStatusUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(input: GetOrderStatusInput) {
    const item = await this.orderRepository.findListItemById(input.orderId)

    if (!item) {
      throw new NotFoundError('Order')
    }

    if (item.userId !== input.userId) {
      throw new ForbiddenError('Order bukan milik Anda')
    }

    const order = await this.orderRepository.findById(input.orderId)

    let proofUrl: string | null = null

    if (item.proofObjectKey) {
      proofUrl = await this.objectStorageService.createSignedPreviewUrl(item.proofObjectKey).catch(() => null)
    }

    return {
      id: item.id,
      orderCode: item.orderCode,
      packageName: item.packageName,
      packageType: item.packageType,
      amount: item.amount,
      status: item.status,
      paymentMethod: item.paymentMethod,
      note: item.note,
      verificationNote: item.verificationNote,
      verifiedAt: item.verifiedAt,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
      proofUrl,
      // Midtrans data
      snapToken: order?.midtransSnapToken ?? null,
      midtransTransactionId: order?.midtransTransactionId ?? null,
      midtransPaymentType: order?.midtransPaymentType ?? null
    }
  }
}
