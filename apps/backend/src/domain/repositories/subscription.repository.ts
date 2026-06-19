/*
Tujuan: Mendefinisikan kontrak repository subscription fase 2 untuk akses paket dan expiry worker.
Caller: Use case verifikasi order, active subscription, dan subscription guard.
Dependensi: SubscriptionEntity domain dan PackageType shared.
Main Functions: Menyediakan operasi cek langganan aktif, create, deactivate, dan expire batch.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { PackageType } from '@lms-bimbel/shared'

import type { SubscriptionEntity } from '../entities/subscription.entity'

export interface CreateSubscriptionInput {
  userId: string
  branchId: string | null
  packageId: string
  orderId: string
  startsAt: Date
  endsAt: Date
  isActive: boolean
}

export interface ActiveSubscriptionView {
  id: string
  packageId: string
  packageName: string
  packageType: PackageType
  startsAt: Date
  endsAt: Date
  isActive: boolean
}

export interface ISubscriptionRepository {
  findCurrentByUserId(userId: string): Promise<SubscriptionEntity | null>
  create(input: CreateSubscriptionInput, executor?: unknown): Promise<SubscriptionEntity>
  deactivateActiveByUserId(userId: string, executor?: unknown): Promise<void>
  expireDueSubscriptions(now?: Date, executor?: unknown): Promise<number>
  getActiveViewByUserId(userId: string): Promise<ActiveSubscriptionView | null>
}
