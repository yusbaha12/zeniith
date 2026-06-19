/*
Tujuan: Menyediakan implementasi repository order berbasis Drizzle untuk checkout murid dan verifikasi admin.
Caller: Use case purchase package, riwayat order, dan verifikasi pembayaran.
Dependensi: AppDatabase, schema orders/packages/users, dan OrderMapper.
Main Functions: Menjalankan query order dengan filter user/branch/status yang hemat I/O dan mudah diindeks.
Side Effects: Membaca dan menulis tabel orders pada PostgreSQL.
*/

import { and, desc, eq } from 'drizzle-orm'

import type { OrderEntity } from '../../domain/entities/order.entity'
import type {
  CreateOrderInput,
  IOrderRepository,
  OrderListItem,
  VerifyOrderInput
} from '../../domain/repositories/order.repository'
import type { AppDatabase } from '../database/connection'
import { orders, packages, users } from '../database/schema'
import { OrderMapper } from '../mappers/order.mapper'

export class OrderRepositoryImpl implements IOrderRepository {
  constructor(private readonly database: AppDatabase) {}

  async create(input: CreateOrderInput, executor?: unknown): Promise<OrderEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .insert(orders)
      .values({
        userId: input.userId,
        branchId: input.branchId,
        packageId: input.packageId,
        orderCode: input.orderCode,
        amount: input.amount,
        status: 'PENDING',
        paymentMethod: input.paymentMethod,
        proofObjectKey: input.proofObjectKey ?? null,
        proofFileName: input.proofFileName ?? null,
        proofContentType: input.proofContentType ?? null,
        note: input.note ?? null,
        expiresAt: input.expiresAt ?? null
      })
      .returning()

    return OrderMapper.toDomain(row)
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const [row] = await this.database.select().from(orders).where(eq(orders.id, id)).limit(1)
    return row ? OrderMapper.toDomain(row) : null
  }

  async findListItemById(id: string): Promise<OrderListItem | null> {
    const [row] = await this.buildListQuery(and(eq(orders.id, id))).limit(1)
    return row ?? null
  }

  async listByUser(userId: string): Promise<OrderListItem[]> {
    return this.buildListQuery(and(eq(orders.userId, userId)))
  }

  async listByBranch(branchId: string, status?: 'PENDING' | 'PAID' | 'REJECTED'): Promise<OrderListItem[]> {
    return this.buildListQuery(
      and(
        eq(orders.branchId, branchId),
        status ? eq(orders.status, status) : undefined
      )
    )
  }

  async listAll(status?: 'PENDING' | 'PAID' | 'REJECTED'): Promise<OrderListItem[]> {
    return this.buildListQuery(status ? and(eq(orders.status, status)) : undefined)
  }

  async updateVerification(id: string, input: VerifyOrderInput, executor?: unknown): Promise<OrderEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .update(orders)
      .set({
        status: input.status,
        verificationNote: input.verificationNote,
        verifiedBy: input.verifiedBy,
        verifiedAt: input.verifiedAt,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning()

    return OrderMapper.toDomain(row)
  }

  private buildListQuery(condition?: ReturnType<typeof and>) {
    return this.database
      .select({
        id: orders.id,
        userId: orders.userId,
        branchId: orders.branchId,
        packageId: orders.packageId,
        packageName: packages.name,
        packageType: packages.type,
        orderCode: orders.orderCode,
        amount: orders.amount,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        proofObjectKey: orders.proofObjectKey,
        note: orders.note,
        verificationNote: orders.verificationNote,
        verifiedAt: orders.verifiedAt,
        expiresAt: orders.expiresAt,
        createdAt: orders.createdAt,
        studentName: users.name,
        studentEmail: users.email
      })
      .from(orders)
      .innerJoin(packages, eq(packages.id, orders.packageId))
      .innerJoin(users, eq(users.id, orders.userId))
      .where(condition)
      .orderBy(desc(orders.createdAt))
  }
}
