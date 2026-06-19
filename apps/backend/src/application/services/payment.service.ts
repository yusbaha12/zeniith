/*
Tujuan: Menyediakan logika pembayaran fase 2 untuk order code, validasi bukti, dan masa langganan.
Caller: Use case pembelian paket dan verifikasi pembayaran.
Dependensi: AppConfig untuk aturan upload bukti transfer.
Main Functions: Memvalidasi file bukti, membangkitkan order code, dan menghitung rentang subscription.
Side Effects: Tidak ada write langsung; service logika murni.
*/

import type { PaymentMethod } from '@lms-bimbel/shared'

import type { AppConfig } from './config.service'
import { AppError } from '../../shared/errors/app.error'

export class PaymentService {
  constructor(private readonly config: AppConfig) {}

  validateProofFile(file: File | null | undefined, paymentMethod: PaymentMethod): void {
    if (paymentMethod === 'BANK_TRANSFER' && !file) {
      throw new AppError('Bukti transfer wajib diunggah untuk metode transfer bank', 422, 'PAYMENT_PROOF_REQUIRED')
    }

    if (!file) {
      return
    }

    if (file.size > this.config.maxUploadSizeMb * 1024 * 1024) {
      throw new AppError(`Ukuran bukti transfer maksimal ${this.config.maxUploadSizeMb} MB`, 422, 'PAYMENT_PROOF_TOO_LARGE')
    }

    if (!this.config.allowedPaymentProofTypes.includes(file.type)) {
      throw new AppError('Format bukti transfer harus JPG, PNG, WEBP, atau PDF', 422, 'PAYMENT_PROOF_INVALID_TYPE')
    }
  }

  generateOrderCode(now: Date = new Date()): string {
    const datePart = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, '0')}${`${now.getDate()}`.padStart(2, '0')}`
    const randomPart = Math.floor(1000 + Math.random() * 9000)
    return `ORD-${datePart}-${randomPart}`
  }

  buildProofObjectKey(orderCode: string, fileName: string): string {
    const normalizedFileName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, '-')
      .replace(/-{2,}/g, '-')

    return `payment-proofs/${orderCode}/${Date.now()}-${normalizedFileName}`
  }

  getOrderExpiry(now: Date = new Date()): Date {
    return new Date(now.getTime() + (48 * 60 * 60 * 1000))
  }

  calculateSubscriptionWindow(durationDays: number, currentEndsAt: Date | null, now: Date = new Date()) {
    const baseDate = currentEndsAt && currentEndsAt.getTime() > now.getTime()
      ? currentEndsAt
      : now

    return {
      startsAt: now,
      endsAt: new Date(baseDate.getTime() + (durationDays * 24 * 60 * 60 * 1000))
    }
  }
}
