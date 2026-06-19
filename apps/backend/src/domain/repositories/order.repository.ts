/*
Tujuan: Mendefinisikan kontrak repository order fase 2 untuk checkout murid dan verifikasi admin.
Caller: Use case purchase package, riwayat order, dan verifikasi pembayaran.
Dependensi: OrderEntity domain dan enum shared.
Main Functions: Menyediakan operasi create, list, baca detail, dan update status order.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { OrderStatus, PackageType, PaymentMethod } from '@lms-bimbel/shared'

import type { OrderEntity } from '../entities/order.entity'

export interface CreateOrderInput {
  userId: string
  branchId: string | null
  packageId: string
  orderCode: string
  amount: number
  paymentMethod: PaymentMethod
  proofObjectKey?: string | null
  proofFileName?: string | null
  proofContentType?: string | null
  note?: string | null
  expiresAt?: Date | null
}

export interface VerifyOrderInput {
  status: Extract<OrderStatus, 'PAID' | 'REJECTED'>
  verificationNote: string | null
  verifiedBy: string
  verifiedAt: Date
}

export interface OrderListItem {
  id: string
  userId: string
  branchId: string | null
  packageId: string
  packageName: string
  packageType: PackageType
  orderCode: string
  amount: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  proofObjectKey: string | null
  note: string | null
  verificationNote: string | null
  verifiedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  studentName: string | null
  studentEmail: string | null
}

export interface IOrderRepository {
  create(input: CreateOrderInput, executor?: unknown): Promise<OrderEntity>
  findById(id: string): Promise<OrderEntity | null>
  findListItemById(id: string): Promise<OrderListItem | null>
  listByUser(userId: string): Promise<OrderListItem[]>
  listByBranch(branchId: string, status?: Extract<OrderStatus, 'PENDING' | 'PAID' | 'REJECTED'>): Promise<OrderListItem[]>
  listAll(status?: Extract<OrderStatus, 'PENDING' | 'PAID' | 'REJECTED'>): Promise<OrderListItem[]>
  updateVerification(id: string, input: VerifyOrderInput, executor?: unknown): Promise<OrderEntity>
}
