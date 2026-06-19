/*
Tujuan: Menyediakan implementasi repository paket berbasis Drizzle untuk katalog publik fase 2.
Caller: Use case list/detail paket dan pembelian paket.
Dependensi: AppDatabase, schema packages/package_features, dan PackageMapper.
Main Functions: Menjalankan query paket aktif dan fitur paket dengan indeks baca minimum cost.
Side Effects: Membaca tabel packages dan package_features pada PostgreSQL.
*/

import { asc, eq } from 'drizzle-orm'
import type Redis from 'ioredis'

import type { PackageEntity } from '../../domain/entities/package.entity'
import type { IPackageRepository, PackageFeatureRecord } from '../../domain/repositories/package.repository'
import type { AppDatabase } from '../database/connection'
import { packageFeatures, packages, packageSubjects } from '../database/schema'
import { PackageMapper } from '../mappers/package.mapper'

export class PackageRepositoryImpl implements IPackageRepository {
  constructor(
    private readonly database: AppDatabase,
    private readonly redisGetter?: () => Redis
  ) {}

  async listActive(): Promise<PackageEntity[]> {
    const redis = this.redisGetter?.()
    const cacheKey = 'packages:active'

    if (redis) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          return parsed.map(PackageMapper.toDomain)
        }
      } catch (err) {
        console.error('[PackageRepositoryImpl] Redis read error:', err)
      }
    }

    const rows = await this.database
      .select()
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(asc(packages.sortOrder), asc(packages.createdAt))

    const entities = rows.map(PackageMapper.toDomain)

    if (redis && rows.length > 0) {
      try {
        await redis.set(cacheKey, JSON.stringify(rows), 'EX', 3600)
      } catch (err) {
        console.error('[PackageRepositoryImpl] Redis write error:', err)
      }
    }

    return entities
  }

  async findById(id: string): Promise<PackageEntity | null> {
    const [row] = await this.database
      .select()
      .from(packages)
      .where(eq(packages.id, id))
      .limit(1)

    return row ? PackageMapper.toDomain(row) : null
  }

  async listFeaturesByPackageId(packageId: string): Promise<PackageFeatureRecord[]> {
    const rows = await this.database
      .select({
        id: packageFeatures.id,
        packageId: packageFeatures.packageId,
        title: packageFeatures.title,
        description: packageFeatures.description,
        sortOrder: packageFeatures.sortOrder
      })
      .from(packageFeatures)
      .where(eq(packageFeatures.packageId, packageId))
      .orderBy(asc(packageFeatures.sortOrder), asc(packageFeatures.createdAt))

    return rows
  }

  async listAll(): Promise<PackageEntity[]> {
    const rows = await this.database
      .select()
      .from(packages)
      .orderBy(asc(packages.sortOrder), asc(packages.createdAt))

    return rows.map(PackageMapper.toDomain)
  }

  async create(input: {
    name: string
    type: 'REGULER' | 'INTENSIF' | 'PREMIUM'
    description: string | null
    price: number
    durationDays: number
    isActive: boolean
    sortOrder: number
  }): Promise<PackageEntity> {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const [row] = await this.database
      .insert(packages)
      .values({
        slug,
        name: input.name,
        type: input.type,
        description: input.description ?? '',
        price: input.price,
        durationDays: input.durationDays,
        isActive: input.isActive,
        sortOrder: input.sortOrder
      })
      .returning()

    const redis = this.redisGetter?.()
    if (redis) {
      await redis.del('packages:active').catch((err) =>
        console.error('[PackageRepositoryImpl] Redis delete error:', err)
      )
    }

    return PackageMapper.toDomain(row)
  }

  async update(
    id: string,
    input: Partial<{
      name: string
      type: 'REGULER' | 'INTENSIF' | 'PREMIUM'
      description: string | null
      price: number
      durationDays: number
      isActive: boolean
      sortOrder: number
    }>
  ): Promise<PackageEntity> {
    const slug = input.name !== undefined
      ? input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : undefined

    const [row] = await this.database
      .update(packages)
      .set({
        slug: slug !== undefined ? slug : undefined,
        name: input.name !== undefined ? input.name : undefined,
        type: input.type !== undefined ? input.type : undefined,
        description: input.description !== undefined ? (input.description ?? '') : undefined,
        price: input.price !== undefined ? input.price : undefined,
        durationDays: input.durationDays !== undefined ? input.durationDays : undefined,
        isActive: input.isActive !== undefined ? input.isActive : undefined,
        sortOrder: input.sortOrder !== undefined ? input.sortOrder : undefined,
        updatedAt: new Date()
      })
      .where(eq(packages.id, id))
      .returning()

    const redis = this.redisGetter?.()
    if (redis) {
      await redis.del('packages:active').catch((err) =>
        console.error('[PackageRepositoryImpl] Redis delete error:', err)
      )
    }

    return PackageMapper.toDomain(row)
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(packages).where(eq(packages.id, id))

    const redis = this.redisGetter?.()
    if (redis) {
      await redis.del('packages:active').catch((err) =>
        console.error('[PackageRepositoryImpl] Redis delete error:', err)
      )
    }
  }

  async findFeatureById(id: string): Promise<PackageFeatureRecord | null> {
    const [row] = await this.database
      .select({
        id: packageFeatures.id,
        packageId: packageFeatures.packageId,
        title: packageFeatures.title,
        description: packageFeatures.description,
        sortOrder: packageFeatures.sortOrder
      })
      .from(packageFeatures)
      .where(eq(packageFeatures.id, id))
      .limit(1)

    return row || null
  }

  async createFeature(input: {
    packageId: string
    title: string
    description: string | null
    sortOrder: number
  }): Promise<PackageFeatureRecord> {
    const [row] = await this.database
      .insert(packageFeatures)
      .values({
        packageId: input.packageId,
        title: input.title,
        description: input.description,
        sortOrder: input.sortOrder
      })
      .returning({
        id: packageFeatures.id,
        packageId: packageFeatures.packageId,
        title: packageFeatures.title,
        description: packageFeatures.description,
        sortOrder: packageFeatures.sortOrder
      })

    const redis = this.redisGetter?.()
    if (redis) {
      await redis.del('packages:active').catch((err) =>
        console.error('[PackageRepositoryImpl] Redis delete error:', err)
      )
    }

    return row
  }

  async updateFeature(
    id: string,
    input: Partial<{
      title: string
      description: string | null
      sortOrder: number
    }>
  ): Promise<PackageFeatureRecord> {
    const [row] = await this.database
      .update(packageFeatures)
      .set({
        title: input.title !== undefined ? input.title : undefined,
        description: input.description !== undefined ? input.description : undefined,
        sortOrder: input.sortOrder !== undefined ? input.sortOrder : undefined,
        updatedAt: new Date()
      })
      .where(eq(packageFeatures.id, id))
      .returning({
        id: packageFeatures.id,
        packageId: packageFeatures.packageId,
        title: packageFeatures.title,
        description: packageFeatures.description,
        sortOrder: packageFeatures.sortOrder
      })

    const redis = this.redisGetter?.()
    if (redis) {
      await redis.del('packages:active').catch((err) =>
        console.error('[PackageRepositoryImpl] Redis delete error:', err)
      )
    }

    return row
  }

  async deleteFeature(id: string): Promise<void> {
    await this.database.delete(packageFeatures).where(eq(packageFeatures.id, id))

    const redis = this.redisGetter?.()
    if (redis) {
      await redis.del('packages:active').catch((err) =>
        console.error('[PackageRepositoryImpl] Redis delete error:', err)
      )
    }
  }

  async assignSubjects(packageId: string, subjectIds: string[], executor?: any): Promise<void> {
    const dbClient = executor || this.database

    await dbClient.delete(packageSubjects).where(eq(packageSubjects.packageId, packageId))

    if (subjectIds.length > 0) {
      await dbClient.insert(packageSubjects).values(
        subjectIds.map((subjectId) => ({
          packageId,
          subjectId
        }))
      )
    }

    const redis = this.redisGetter?.()
    if (redis) {
      await redis.del('packages:active').catch((err) =>
        console.error('[PackageRepositoryImpl] Redis delete error:', err)
      )
    }
  }

  async listSubjectsByPackageId(packageId: string): Promise<string[]> {
    const rows = await this.database
      .select({
        subjectId: packageSubjects.subjectId
      })
      .from(packageSubjects)
      .where(eq(packageSubjects.packageId, packageId))

    return rows.map((r) => r.subjectId)
  }
}

