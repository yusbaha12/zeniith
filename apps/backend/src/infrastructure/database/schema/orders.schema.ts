/*
Tujuan: Mendefinisikan schema tabel orders untuk checkout murid, verifikasi admin, dan Midtrans gateway fase 2.
Caller: Drizzle Kit, order repository, dan use case pembayaran.
Dependensi: drizzle-orm/pg-core dan schema users/branches/packages.
Main Functions: Menyimpan transaksi pembelian, bukti transfer, status verifikasi, token Midtrans, dan indeks list efisien.
Side Effects: Menjadi sumber migration database untuk modul order.
*/

import { index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { branches } from './branches.schema'
import { packages } from './packages.schema'
import { users } from './users.schema'

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'PAID',
  'REJECTED',
  'EXPIRED',
  'REFUNDED'
])

export const paymentMethodEnum = pgEnum('payment_method', [
  'BANK_TRANSFER',
  'QRIS',
  'VIRTUAL_ACCOUNT'
])

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'restrict' }),
  packageId: uuid('package_id').notNull().references(() => packages.id, { onDelete: 'restrict' }),
  orderCode: varchar('order_code', { length: 40 }).notNull().unique(),
  amount: integer('amount').notNull(),
  status: orderStatusEnum('status').notNull().default('PENDING'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  proofObjectKey: text('proof_object_key'),
  proofFileName: varchar('proof_file_name', { length: 255 }),
  proofContentType: varchar('proof_content_type', { length: 120 }),
  note: text('note'),
  verificationNote: text('verification_note'),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at'),
  expiresAt: timestamp('expires_at'),
  // Midtrans payment gateway columns
  midtransSnapToken: text('midtrans_snap_token'),
  midtransTransactionId: varchar('midtrans_transaction_id', { length: 100 }),
  midtransPaymentType: varchar('midtrans_payment_type', { length: 60 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userCreatedIndex: index('idx_orders_user_created').on(table.userId, table.createdAt),
  branchStatusCreatedIndex: index('idx_orders_branch_status_created').on(table.branchId, table.status, table.createdAt),
  statusCreatedIndex: index('idx_orders_status_created').on(table.status, table.createdAt),
  packageIndex: index('idx_orders_package').on(table.packageId)
}))
