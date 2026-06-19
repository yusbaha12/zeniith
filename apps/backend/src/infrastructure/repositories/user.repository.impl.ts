/*
Tujuan: Menyediakan implementasi repository user berbasis Drizzle untuk auth dan profile fase 1.
Caller: Use case auth/profile dan middleware auth.
Dependensi: AppDatabase, schema users, UserMapper.
Main Functions: Menjalankan query user yang efisien pada email/id serta operasi tulis profile/password.
Side Effects: Membaca dan menulis tabel users pada PostgreSQL.
*/

import { eq, and, or, like, sql } from 'drizzle-orm'
import type { Role } from '@lms-bimbel/shared'

import type { UserEntity } from '../../domain/entities/user.entity'
import type { CreateUserInput, IUserRepository, UpdateProfileInput } from '../../domain/repositories/user.repository'
import type { AppDatabase } from '../database/connection'
import { users } from '../database/schema'
import { UserMapper } from '../mappers/user.mapper'

export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly database: AppDatabase) {}

  async findById(id: string): Promise<UserEntity | null> {
    const [result] = await this.database.select().from(users).where(eq(users.id, id)).limit(1)
    return result ? UserMapper.toDomain(result) : null
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [result] = await this.database.select().from(users).where(eq(users.email, email)).limit(1)
    return result ? UserMapper.toDomain(result) : null
  }

  async create(input: CreateUserInput, executor?: unknown): Promise<UserEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [result] = await database.insert(users).values({
      branchId: input.branchId,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      phone: input.phone,
      role: input.role,
      avatarUrl: input.avatarUrl ?? null,
      isActive: input.isActive ?? true
    }).returning()

    return UserMapper.toDomain(result)
  }

  async updateProfile(id: string, input: UpdateProfileInput, executor?: unknown): Promise<UserEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [result] = await database
      .update(users)
      .set({
        name: input.name,
        phone: input.phone,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning()

    return UserMapper.toDomain(result)
  }

  async updatePassword(id: string, passwordHash: string, executor?: unknown): Promise<void> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    await database
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
  }

  async listUsers(filter: {
    role?: Role
    branchId?: string | null
    searchQuery?: string
    limit?: number
    offset?: number
  }): Promise<{ items: UserEntity[]; total: number }> {
    const whereConditions = []

    if (filter.role) {
      whereConditions.push(eq(users.role, filter.role))
    }

    if (filter.branchId) {
      whereConditions.push(eq(users.branchId, filter.branchId))
    }

    if (filter.searchQuery) {
      whereConditions.push(
        or(
          like(users.name, `%${filter.searchQuery}%`),
          like(users.email, `%${filter.searchQuery}%`)
        )
      )
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // 1. Get total matching records count
    const [countResult] = await this.database
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause)

    const total = Number(countResult?.count || 0)

    // 2. Query matching records with limit and offset
    const rows = await (filter.limit !== undefined && filter.offset !== undefined
      ? this.database
          .select()
          .from(users)
          .where(whereClause)
          .orderBy(users.name)
          .limit(filter.limit)
          .offset(filter.offset)
      : this.database
          .select()
          .from(users)
          .where(whereClause)
          .orderBy(users.name))

    return {
      items: rows.map((row) => UserMapper.toDomain(row)),
      total
    }
  }

  async update(id: string, input: Partial<CreateUserInput>, executor?: unknown): Promise<UserEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [result] = await database
      .update(users)
      .set({
        branchId: input.branchId !== undefined ? input.branchId : undefined,
        name: input.name !== undefined ? input.name : undefined,
        email: input.email !== undefined ? input.email : undefined,
        passwordHash: input.passwordHash !== undefined ? input.passwordHash : undefined,
        phone: input.phone !== undefined ? input.phone : undefined,
        role: input.role !== undefined ? input.role : undefined,
        avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : undefined,
        isActive: input.isActive !== undefined ? input.isActive : undefined,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning()

    return UserMapper.toDomain(result)
  }

  async delete(id: string, executor?: unknown): Promise<void> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    await database.delete(users).where(eq(users.id, id))
  }
}
