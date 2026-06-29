/*
Tujuan: Menyediakan kontrak tipe order frontend fase 2 untuk checkout, riwayat pembelian, verifikasi admin, dan Midtrans payment gateway.
Caller: API order frontend dan halaman student/admin terkait pembayaran.
Dependensi: Shared enum order/payment/package type.
Main Functions: Menstandarkan payload order, hasil checkout, aksi verifikasi admin, detail status, dan data Snap token.
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

export interface OrderDetailResult {
  id: string
  orderCode: string
  packageName: string
  packageType: PackageType
  amount: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  note: string | null
  verificationNote: string | null
  verifiedAt: string | null
  expiresAt: string | null
  createdAt: string
  proofUrl: string | null
  // Midtrans
  snapToken: string | null
  midtransTransactionId: string | null
  midtransPaymentType: string | null
}
