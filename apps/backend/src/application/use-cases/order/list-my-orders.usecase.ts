/*
Tujuan: Menyediakan use case riwayat order murid fase 2 untuk halaman pembelian saya.
Caller: Order controller murid.
Dependensi: IOrderRepository dan ObjectStorageService.
Main Functions: Mengambil order milik murid dan menambahkan signed preview URL bila bukti transfer tersedia.
Side Effects: Membaca tabel orders/packages/users dan dapat membuat signed URL ke MinIO/S3.
*/

import type { IOrderRepository } from '../../../domain/repositories/order.repository'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'

export class ListMyOrdersUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(userId: string) {
    const orders = await this.orderRepository.listByUser(userId)

    return Promise.all(orders.map(async (order) => ({
      ...order,
      proofUrl: order.proofObjectKey
        ? await this.objectStorageService.createSignedPreviewUrl(order.proofObjectKey)
        : null
    })))
  }
}
