/*
Tujuan: Menyediakan integrasi Midtrans Snap API untuk pembuatan token pembayaran dan verifikasi notifikasi webhook.
Caller: CreateMidtransTokenUseCase dan HandleMidtransNotificationUseCase.
Dependensi: AppConfig (server key, client key, is production).
Main Functions: createSnapToken(), verifyNotificationSignature(), parseNotificationStatus().
Side Effects: HTTP call ke API Midtrans (app.sandbox.midtrans.com atau app.midtrans.com).
*/

import { createHash } from 'node:crypto'

import type { AppConfig } from './config.service'
import { AppError } from '../../shared/errors/app.error'

export interface MidtransSnapTokenInput {
  orderId: string
  grossAmount: number
  customerName: string
  customerEmail: string
  itemName: string
}

export interface MidtransSnapTokenResult {
  token: string
  redirectUrl: string
}

export interface MidtransNotificationPayload {
  order_id: string
  transaction_id: string
  transaction_status: string
  payment_type: string
  gross_amount: string
  status_code: string
  signature_key: string
  fraud_status?: string
}

export type MidtransPaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCEL' | 'EXPIRED'

export class MidtransService {
  private readonly snapBaseUrl: string
  private readonly apiBaseUrl: string

  constructor(private readonly config: AppConfig) {
    this.snapBaseUrl = config.midtransIsProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1'
    this.apiBaseUrl = config.midtransIsProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2'
  }

  /**
   * Membuat Midtrans Snap token untuk pembayaran QRIS / Virtual Account.
   * Order ID yang digunakan adalah order.orderCode agar mudah dicocokkan pada webhook.
   */
  async createSnapToken(input: MidtransSnapTokenInput): Promise<MidtransSnapTokenResult> {
    const serverKey = this.config.midtransServerKey

    if (!serverKey) {
      throw new AppError('Midtrans server key belum dikonfigurasi', 500, 'MIDTRANS_NOT_CONFIGURED')
    }

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64')

    const body = {
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.grossAmount
      },
      customer_details: {
        first_name: input.customerName,
        email: input.customerEmail
      },
      item_details: [
        {
          id: input.orderId,
          price: input.grossAmount,
          quantity: 1,
          name: input.itemName.slice(0, 50)
        }
      ],
      enabled_payments: ['qris', 'bni_va', 'bri_va', 'bca_va', 'mandiri_bill', 'permata_va', 'other_va'],
      expiry: {
        unit: 'hours',
        duration: 24
      }
    }

    const response = await fetch(`${this.snapBaseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authHeader}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new AppError(`Midtrans Snap API error: ${errorBody}`, 502, 'MIDTRANS_SNAP_ERROR')
    }

    const data = await response.json() as { token: string; redirect_url: string }

    return {
      token: data.token,
      redirectUrl: data.redirect_url
    }
  }

  /**
   * Memverifikasi signature_key dari notifikasi Midtrans.
   * Formula: SHA512(order_id + status_code + gross_amount + server_key)
   */
  verifyNotificationSignature(payload: MidtransNotificationPayload): boolean {
    const { order_id, status_code, gross_amount, signature_key } = payload
    const rawSignature = `${order_id}${status_code}${gross_amount}${this.config.midtransServerKey}`
    const expectedSignature = createHash('sha512').update(rawSignature).digest('hex')
    return expectedSignature === signature_key
  }

  /**
   * Memetakan transaction_status + fraud_status Midtrans ke status payment internal.
   * Referensi: https://docs.midtrans.com/reference/transaction-status
   */
  parseNotificationStatus(payload: MidtransNotificationPayload): MidtransPaymentStatus {
    const { transaction_status, fraud_status } = payload

    if (transaction_status === 'capture') {
      return fraud_status === 'accept' ? 'SUCCESS' : 'FAILED'
    }

    if (transaction_status === 'settlement') {
      return 'SUCCESS'
    }

    if (['pending'].includes(transaction_status)) {
      return 'PENDING'
    }

    if (['deny', 'failure'].includes(transaction_status)) {
      return 'FAILED'
    }

    if (['cancel', 'refund', 'partial_refund'].includes(transaction_status)) {
      return 'CANCEL'
    }

    if (transaction_status === 'expire') {
      return 'EXPIRED'
    }

    return 'PENDING'
  }
}
