/*
Tujuan: Menyediakan implementasi repository branch berbasis Drizzle untuk fase auth/register.
Caller: Branch use case dan register use case.
Dependensi: AppDatabase, schema branches, BranchMapper.
Main Functions: Membaca daftar cabang aktif dan mencari cabang berdasarkan id dengan query ringan berindeks.
Side Effects: Membaca tabel branches dari PostgreSQL.
*/

import { asc, eq } from 'drizzle-orm'

import type { BranchEntity } from '../../domain/entities/branch.entity'
import type { IBranchRepository } from '../../domain/repositories/branch.repository'
import type { AppDatabase } from '../database/connection'
import { branches } from '../database/schema'
import { BranchMapper } from '../mappers/branch.mapper'

export class BranchRepositoryImpl implements IBranchRepository {
  constructor(private readonly database: AppDatabase) {}

  async findById(id: string): Promise<BranchEntity | null> {
    const [result] = await this.database.select().from(branches).where(eq(branches.id, id)).limit(1)
    return result ? BranchMapper.toDomain(result) : null
  }

  async findActive(): Promise<BranchEntity[]> {
    const results = await this.database
      .select()
      .from(branches)
      .where(eq(branches.isActive, true))
      .orderBy(asc(branches.name))

    return results.map((branch) => BranchMapper.toDomain(branch))
  }

  async listAll(): Promise<BranchEntity[]> {
    const results = await this.database
      .select()
      .from(branches)
      .orderBy(asc(branches.name))

    return results.map((branch) => BranchMapper.toDomain(branch))
  }

  async create(input: {
    name: string
    code: string
    address: string | null
    city: string | null
    phone: string | null
    isActive: boolean
  }): Promise<BranchEntity> {
    const [result] = await this.database
      .insert(branches)
      .values({
        name: input.name,
        code: input.code,
        address: input.address,
        city: input.city,
        phone: input.phone,
        isActive: input.isActive
      })
      .returning()

    return BranchMapper.toDomain(result)
  }

  async update(
    id: string,
    input: Partial<{
      name: string
      code: string
      address: string | null
      city: string | null
      phone: string | null
      isActive: boolean
    }>
  ): Promise<BranchEntity> {
    const [result] = await this.database
      .update(branches)
      .set({
        name: input.name !== undefined ? input.name : undefined,
        code: input.code !== undefined ? input.code : undefined,
        address: input.address !== undefined ? input.address : undefined,
        city: input.city !== undefined ? input.city : undefined,
        phone: input.phone !== undefined ? input.phone : undefined,
        isActive: input.isActive !== undefined ? input.isActive : undefined,
        updatedAt: new Date()
      })
      .where(eq(branches.id, id))
      .returning()

    return BranchMapper.toDomain(result)
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(branches).where(eq(branches.id, id))
  }
}
