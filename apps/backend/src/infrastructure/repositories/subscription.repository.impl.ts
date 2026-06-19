/*
Tujuan: Menyediakan implementasi repository subscription berbasis Drizzle untuk akses paket dan expiry worker.
Caller: Use case verifikasi order, active subscription, dan middleware subscription guard.
Dependensi: AppDatabase, schema subscriptions/packages, dan SubscriptionMapper.
Main Functions: Menjalankan query cek langganan aktif dan batch expire dengan indeks user-active-ends_at.
Side Effects: Membaca dan menulis tabel subscriptions pada PostgreSQL.
*/

import { and, desc, eq, lte, gt } from 'drizzle-orm'

import type {
  ActiveSubscriptionView,
  CreateSubscriptionInput,
  ISubscriptionRepository
} from '../../domain/repositories/subscription.repository'
import type { SubscriptionEntity } from '../../domain/entities/subscription.entity'
import type { AppDatabase } from '../database/connection'
import { packages, subscriptions } from '../database/schema'
import { SubscriptionMapper } from '../mappers/subscription.mapper'

export class SubscriptionRepositoryImpl implements ISubscriptionRepository {
  constructor(private readonly database: AppDatabase) {}

  async findCurrentByUserId(userId: string): Promise<SubscriptionEntity | null> {
    const now = new Date()
    const [row] = await this.database
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.isActive, true),
          gt(subscriptions.endsAt, now)
        )
      )
      .orderBy(desc(subscriptions.endsAt))
      .limit(1)

    return row ? SubscriptionMapper.toDomain(row) : null
  }

  async create(input: CreateSubscriptionInput, executor?: unknown): Promise<SubscriptionEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .insert(subscriptions)
      .values({
        userId: input.userId,
        branchId: input.branchId,
        packageId: input.packageId,
        orderId: input.orderId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isActive: input.isActive
      })
      .returning()

    return SubscriptionMapper.toDomain(row)
  }

  async deactivateActiveByUserId(userId: string, executor?: unknown): Promise<void> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    await database
      .update(subscriptions)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.isActive, true)))
  }

  async expireDueSubscriptions(now: Date = new Date(), executor?: unknown): Promise<number> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const rows = await database
      .update(subscriptions)
      .set({
        isActive: false,
        updatedAt: now
      })
      .where(and(eq(subscriptions.isActive, true), lte(subscriptions.endsAt, now)))
      .returning({ id: subscriptions.id })

    return rows.length
  }

  async getActiveViewByUserId(userId: string): Promise<ActiveSubscriptionView | null> {
    const now = new Date()
    const [row] = await this.database
      .select({
        id: subscriptions.id,
        packageId: subscriptions.packageId,
        packageName: packages.name,
        packageType: packages.type,
        startsAt: subscriptions.startsAt,
        endsAt: subscriptions.endsAt,
        isActive: subscriptions.isActive
      })
      .from(subscriptions)
      .innerJoin(packages, eq(packages.id, subscriptions.packageId))
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.isActive, true),
          gt(subscriptions.endsAt, now)
        )
      )
      .orderBy(desc(subscriptions.endsAt))
      .limit(1)

    return row ?? null
  }
}
