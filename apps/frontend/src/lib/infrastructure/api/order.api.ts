/*
Tujuan: Menyediakan module API frontend fase 2 untuk checkout, riwayat order, verifikasi admin, dan Midtrans payment gateway.
Caller: Halaman checkout murid, riwayat pembelian, order detail, materi locked state, dan admin pembayaran.
Dependensi: API client, tipe order frontend, dan tipe subscription frontend.
Main Functions: Membuat order multipart, mengambil order student/admin, verifikasi pembayaran, snap token Midtrans, polling status, dan cek langganan aktif.
Side Effects: Melakukan HTTP call ke backend `/api/orders*`, `/api/admin/orders*`, `/api/payments*`, dan `/api/subscriptions*`.
*/

import type {
  AdminOrderStatusFilter,
  CreateOrderResult,
  FrontendOrderItem,
  OrderDetailResult,
  VerifyOrderAction
} from '$lib/domain/types/order.types'
import type { ActiveSubscription } from '$lib/domain/types/subscription.types'

import { apiClient } from './client'

export const orderApi = {
  create: (payload: FormData) => apiClient.post<CreateOrderResult>('/orders', payload),
  listMine: () => apiClient.get<FrontendOrderItem[]>('/orders/my'),
  getStatus: (orderId: string) => apiClient.get<OrderDetailResult>(`/orders/${orderId}/status`),
  snapToken: (orderId: string) =>
    apiClient.post<{ snapToken: string; clientKey: string; orderCode: string; amount: number; amountLabel: string }>(
      `/orders/${orderId}/midtrans-token`,
      {}
    ),
  listAdmin: (status?: AdminOrderStatusFilter) =>
    apiClient.get<FrontendOrderItem[]>(`/admin/orders${status ? `?status=${status}` : ''}`),
  verify: (orderId: string, action: VerifyOrderAction, note?: string) =>
    apiClient.patch<{ id: string; status: 'PAID' | 'REJECTED'; startsAt?: string; endsAt?: string }>(
      `/admin/orders/${orderId}/verify`,
      {
        action,
        note
      }
    ),
  activeSubscription: () => apiClient.get<ActiveSubscription | null>('/subscriptions/me/active')
}
