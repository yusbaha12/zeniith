/*
Tujuan: Menyediakan module API frontend fase 2 untuk checkout, riwayat order, dan verifikasi admin.
Caller: Halaman checkout murid, riwayat pembelian, materi locked state, dan admin pembayaran.
Dependensi: API client, tipe order frontend, dan tipe subscription frontend.
Main Functions: Membuat order multipart, mengambil order student/admin, verifikasi pembayaran, dan cek langganan aktif.
Side Effects: Melakukan HTTP call ke backend `/api/orders*`, `/api/admin/orders*`, dan `/api/subscriptions*`.
*/

import type {
  AdminOrderStatusFilter,
  CreateOrderResult,
  FrontendOrderItem,
  VerifyOrderAction
} from '$lib/domain/types/order.types'
import type { ActiveSubscription } from '$lib/domain/types/subscription.types'

import { apiClient } from './client'

export const orderApi = {
  create: (payload: FormData) => apiClient.post<CreateOrderResult>('/orders', payload),
  listMine: () => apiClient.get<FrontendOrderItem[]>('/orders/my'),
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
