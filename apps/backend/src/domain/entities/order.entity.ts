/*
Tujuan: Merepresentasikan entitas order paket fase 2 untuk checkout dan verifikasi pembayaran.
Caller: Order repository, payment service, dan use case order admin/murid.
Dependensi: Shared enum payment/order status dan MoneyVO.
Main Functions: Menyimpan data transaksi dan helper status verifikasi.
Side Effects: Tidak ada; entitas domain murni.
*/

import type { OrderStatus, PaymentMethod } from '@lms-bimbel/shared'

import { MoneyVO } from '../value-objects/money.vo'

export class OrderEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly branchId: string | null,
    public readonly packageId: string,
    public readonly orderCode: string,
    public readonly amount: MoneyVO,
    public readonly status: OrderStatus,
    public readonly paymentMethod: PaymentMethod,
    public readonly proofObjectKey: string | null,
    public readonly proofFileName: string | null,
    public readonly proofContentType: string | null,
    public readonly note: string | null,
    public readonly verificationNote: string | null,
    public readonly verifiedBy: string | null,
    public readonly verifiedAt: Date | null,
    public readonly expiresAt: Date | null,
    public readonly createdAt: Date
  ) {}

  isPending(): boolean {
    return this.status === 'PENDING'
  }

  canBeVerified(): boolean {
    return this.status === 'PENDING'
  }
}
