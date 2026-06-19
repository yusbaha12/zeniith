/*
Tujuan: Merepresentasikan nilai uang paket dan order fase 2 secara aman.
Caller: Entity paket/order, use case pembayaran, dan repository order.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menjaga nominal tetap bilangan bulat positif dan memberi formatter sederhana.
Side Effects: Tidak ada; value object domain murni.
*/

import { AppError } from '../../shared/errors/app.error'

export class MoneyVO {
  private constructor(public readonly amount: number) {}

  static create(amount: number): MoneyVO {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AppError('Nominal harus berupa bilangan bulat positif', 422, 'INVALID_AMOUNT')
    }

    return new MoneyVO(amount)
  }

  formatRupiah(): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(this.amount)
  }
}
