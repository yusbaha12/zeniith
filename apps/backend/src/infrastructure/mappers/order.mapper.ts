/*
Tujuan: Memetakan row tabel orders menjadi OrderEntity domain fase 2.
Caller: Order repository Drizzle.
Dependensi: OrderEntity dan MoneyVO.
Main Functions: Menjaga transformasi DB ke domain tetap terpusat dan konsisten.
Side Effects: Tidak ada; mapper murni.
*/

import type { orders } from '../database/schema'
import { OrderEntity } from '../../domain/entities/order.entity'
import { MoneyVO } from '../../domain/value-objects/money.vo'

type OrderRow = typeof orders.$inferSelect

export class OrderMapper {
  static toDomain(row: OrderRow): OrderEntity {
    return new OrderEntity(
      row.id,
      row.userId,
      row.branchId,
      row.packageId,
      row.orderCode,
      MoneyVO.create(row.amount),
      row.status,
      row.paymentMethod,
      row.proofObjectKey,
      row.proofFileName,
      row.proofContentType,
      row.note,
      row.verificationNote,
      row.verifiedBy,
      row.verifiedAt,
      row.expiresAt,
      row.createdAt
    )
  }
}
