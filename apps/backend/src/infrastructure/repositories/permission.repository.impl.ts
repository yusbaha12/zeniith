/*
Tujuan: Menyediakan implementasi repository permission berbasis Drizzle untuk baseline role dan override user.
Caller: AuthorizationService dan middleware authz backend.
Dependensi: AppDatabase, schema permissions/role_permissions/user_permissions, dan Drizzle query helper.
Main Functions: Menjalankan query join terindeks untuk mengambil code permission role dan override user yang masih aktif.
Side Effects: Membaca tabel permissions, role_permissions, dan user_permissions pada PostgreSQL.
*/

import { and, eq, gte, isNull, or } from 'drizzle-orm'

import type { Role } from '@lms-bimbel/shared'

import type { IPermissionRepository, UserPermissionOverride } from '../../domain/repositories/permission.repository'
import type { AppDatabase } from '../database/connection'
import { permissions, rolePermissions, userPermissions } from '../database/schema'

export class PermissionRepositoryImpl implements IPermissionRepository {
  constructor(private readonly database: AppDatabase) {}

  async listRolePermissionCodes(role: Role): Promise<string[]> {
    const rows = await this.database
      .select({
        code: permissions.code
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.role, role))

    return rows.map((row) => row.code)
  }

  async listEffectiveUserPermissionOverrides(userId: string, activeAt: Date): Promise<UserPermissionOverride[]> {
    const rows = await this.database
      .select({
        code: permissions.code,
        effect: userPermissions.effect
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(and(
        eq(userPermissions.userId, userId),
        or(
          isNull(userPermissions.expiresAt),
          gte(userPermissions.expiresAt, activeAt)
        )
      ))

    return rows.map((row) => ({
      code: row.code,
      effect: row.effect
    }))
  }
}
