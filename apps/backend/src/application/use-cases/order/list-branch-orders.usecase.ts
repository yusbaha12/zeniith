/*
Tujuan: Menyediakan use case daftar order cabang fase 2 untuk verifikasi pembayaran admin.
Caller: Admin order controller.
Dependensi: IOrderRepository dan ObjectStorageService.
Main Functions: Mengambil order berdasarkan scope cabang/status lalu menambahkan signed preview URL bila ada bukti.
Side Effects: Membaca tabel orders/packages/users dan dapat membuat signed URL ke MinIO/S3.
*/

import type { Role } from '@lms-bimbel/shared'

import type { IOrderRepository } from '../../../domain/repositories/order.repository'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'

interface ListBranchOrdersInput {
  role: Role
  branchId: string | null
  status?: 'PENDING' | 'PAID' | 'REJECTED'
}

export class ListBranchOrdersUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(input: ListBranchOrdersInput) {
    const orders = input.role === 'SUPER_ADMIN'
      ? await this.orderRepository.listAll(input.status)
      : await this.orderRepository.listByBranch(input.branchId ?? '', input.status)

    return Promise.all(orders.map(async (order) => ({
      ...order,
      proofUrl: order.proofObjectKey
        ? await this.objectStorageService.createSignedPreviewUrl(order.proofObjectKey)
        : null
    })))
  }
}
