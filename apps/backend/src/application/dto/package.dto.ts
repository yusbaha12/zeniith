/*
Tujuan: Menyediakan DTO validasi request fase 2 untuk paket, order, dan verifikasi pembayaran.
Caller: Controller paket, order murid, dan order admin cabang.
Dependensi: Elysia validator `t`.
Main Functions: Memvalidasi body multipart/JSON, params, dan query string fase 2.
Side Effects: Tidak ada; hanya definisi schema validasi runtime.
*/

import { t } from 'elysia'

export const PackageIdParamsDto = t.Object({
  id: t.String({ format: 'uuid' })
})

export const OrderIdParamsDto = t.Object({
  id: t.String({ format: 'uuid' })
})

export const PaymentMethodDto = t.Union([
  t.Literal('BANK_TRANSFER'),
  t.Literal('QRIS'),
  t.Literal('VIRTUAL_ACCOUNT')
])

export const OrderStatusDto = t.Union([
  t.Literal('PENDING'),
  t.Literal('PAID'),
  t.Literal('REJECTED')
])

export const CreateOrderDto = t.Object({
  packageId: t.String({ format: 'uuid' }),
  paymentMethod: PaymentMethodDto,
  note: t.Optional(t.String({ maxLength: 300 })),
  proofFile: t.Optional(t.File())
})

export const AdminOrdersQueryDto = t.Object({
  status: t.Optional(OrderStatusDto)
})

export const VerifyOrderDto = t.Object({
  action: t.Union([t.Literal('APPROVE'), t.Literal('REJECT')]),
  note: t.Optional(t.String({ maxLength: 300 }))
})
