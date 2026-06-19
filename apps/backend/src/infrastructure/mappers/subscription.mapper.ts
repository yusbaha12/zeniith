/*
Tujuan: Memetakan row tabel subscriptions menjadi SubscriptionEntity domain fase 2.
Caller: Subscription repository Drizzle.
Dependensi: SubscriptionEntity.
Main Functions: Menjaga transformasi DB ke domain tetap terpusat dan konsisten.
Side Effects: Tidak ada; mapper murni.
*/

import type { subscriptions } from '../database/schema'
import { SubscriptionEntity } from '../../domain/entities/subscription.entity'

type SubscriptionRow = typeof subscriptions.$inferSelect

export class SubscriptionMapper {
  static toDomain(row: SubscriptionRow): SubscriptionEntity {
    return new SubscriptionEntity(
      row.id,
      row.userId,
      row.branchId,
      row.packageId,
      row.orderId,
      row.startsAt,
      row.endsAt,
      row.isActive
    )
  }
}
