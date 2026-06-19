/*
Tujuan: Menyediakan kontrak tipe order frontend fase 2 untuk checkout, riwayat pembelian, dan verifikasi admin.
Caller: API order frontend dan halaman student/admin terkait pembayaran.
Dependensi: Shared enum order/payment/package type.
Main Functions: Menstandarkan payload order, hasil checkout, dan aksi verifikasi admin.
Side Effects: Tidak ada; file type murni.
*/

import type { OrderStatus, PackageType, PaymentMethod } from '@lms-bimbel/shared'

export interface CreateOrderResult {
  id: string
  orderCode: string
  packageName: string
  amount: number
  amountLabel: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  expiresAt: string | null
}

export interface FrontendOrderItem {
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
  proofUrl: string | null
  note: string | null
  verificationNote: string | null
  verifiedAt: string | null
  expiresAt: string | null
  createdAt: string
  studentName: string | null
  studentEmail: string | null
}

export type AdminOrderStatusFilter = Extract<OrderStatus, 'PENDING' | 'PAID' | 'REJECTED'>
export type VerifyOrderAction = 'APPROVE' | 'REJECT'
