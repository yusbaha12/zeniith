/*
Tujuan: Menyediakan resolver permission efektif berbasis role baseline, override user, dan cache Redis.
Caller: Auth middleware, permission guard, dan alur invalidasi authz fase 7.
Dependensi: IPermissionRepository dan Redis client factory.
Main Functions: Mengambil permission role/user secara efisien, menggabungkan override DENY/ALLOW, serta menyimpan hasil final ke cache authz.
Side Effects: Membaca PostgreSQL RBAC, membaca/menulis Redis cache authz, dan dapat menghapus cache user saat invalidasi.
*/

import type { Redis } from 'ioredis'

import type { Role } from '@lms-bimbel/shared'

import type { IPermissionRepository } from '../../domain/repositories/permission.repository'

export interface AuthorizationSubject {
  id: string
  role: Role
}

export interface ResolvedAuthorization {
  permissions: string[]
}

const USER_CACHE_TTL_SECONDS = 300
const ROLE_CACHE_TTL_SECONDS = 900

export class AuthorizationService {
  private cacheAvailable = true

  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly getRedisClient: () => Redis
  ) {}

  async resolveForUser(subject: AuthorizationSubject): Promise<ResolvedAuthorization> {
    const userCacheKey = this.getUserCacheKey(subject.id)
    const cachedUserPermissions = await this.readCache(userCacheKey)

    if (cachedUserPermissions) {
      return {
        permissions: cachedUserPermissions
      }
    }

    const basePermissions = await this.getRolePermissions(subject.role)
    const overrides = await this.permissionRepository.listEffectiveUserPermissionOverrides(subject.id, new Date())
    const effectivePermissions = this.mergePermissions(basePermissions, overrides)

    await this.writeCache(userCacheKey, effectivePermissions, USER_CACHE_TTL_SECONDS)

    return {
      permissions: effectivePermissions
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    if (!this.cacheAvailable) {
      return
    }

    try {
      const redis = this.getRedisClient()
      await redis.del(this.getUserCacheKey(userId))
    } catch (error) {
      this.cacheAvailable = false
      console.error('[authorization.service.invalidateUser]', error)
    }
  }

  private async getRolePermissions(role: Role): Promise<string[]> {
    const roleCacheKey = this.getRoleCacheKey(role)
    const cachedRolePermissions = await this.readCache(roleCacheKey)

    if (cachedRolePermissions) {
      return cachedRolePermissions
    }

    const permissions = await this.permissionRepository.listRolePermissionCodes(role)
    await this.writeCache(roleCacheKey, permissions, ROLE_CACHE_TTL_SECONDS)

    return permissions
  }

  private mergePermissions(
    basePermissions: string[],
    overrides: Awaited<ReturnType<IPermissionRepository['listEffectiveUserPermissionOverrides']>>
  ): string[] {
    const permissionSet = new Set(basePermissions)

    for (const override of overrides) {
      if (override.effect === 'DENY') {
        permissionSet.delete(override.code)
        continue
      }

      permissionSet.add(override.code)
    }

    return [...permissionSet].sort((left, right) => left.localeCompare(right))
  }

  private async readCache(key: string): Promise<string[] | null> {
    if (!this.cacheAvailable) {
      return null
    }

    try {
      const redis = this.getRedisClient()
      const raw = await redis.get(key)

      if (!raw) {
        return null
      }

      const parsed = JSON.parse(raw) as unknown
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : null
    } catch (error) {
      this.cacheAvailable = false
      console.error('[authorization.service.readCache]', error)
      return null
    }
  }

  private async writeCache(key: string, permissions: string[], ttlSeconds: number): Promise<void> {
    if (!this.cacheAvailable) {
      return
    }

    try {
      const redis = this.getRedisClient()
      await redis.set(key, JSON.stringify(permissions), 'EX', ttlSeconds)
    } catch (error) {
      this.cacheAvailable = false
      console.error('[authorization.service.writeCache]', error)
    }
  }

  private getUserCacheKey(userId: string): string {
    return `authz:user:${userId}`
  }

  private getRoleCacheKey(role: Role): string {
    return `authz:role:${role}`
  }
}
