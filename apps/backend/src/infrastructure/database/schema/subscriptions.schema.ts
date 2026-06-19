/*
Tujuan: Mendefinisikan schema tabel subscriptions untuk akses aktif paket belajar fase 2.
Caller: Drizzle Kit, subscription repository, subscription guard, dan expiry worker.
Dependensi: drizzle-orm/pg-core dan schema users/branches/packages/orders.
Main Functions: Menyimpan rentang langganan aktif per murid dengan indeks cek akses yang murah.
Side Effects: Menjadi sumber migration database untuk modul subscription.
*/

import { index, pgTable, timestamp, uniqueIndex, uuid, boolean } from 'drizzle-orm/pg-core'

import { branches } from './branches.schema'
import { orders } from './orders.schema'
import { packages } from './packages.schema'
import { users } from './users.schema'

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'restrict' }),
  packageId: uuid('package_id').notNull().references(() => packages.id, { onDelete: 'restrict' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  orderUniqueIndex: uniqueIndex('uidx_subscriptions_order').on(table.orderId),
  userActiveEndsAtIndex: index('idx_subscriptions_user_active_ends_at').on(table.userId, table.isActive, table.endsAt),
  branchActiveIndex: index('idx_subscriptions_branch_active').on(table.branchId, table.isActive)
}))
