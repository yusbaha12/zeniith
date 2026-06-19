/*
Tujuan: Mendefinisikan kontrak repository permission untuk baseline role dan override user pada RBAC granular.
Caller: AuthorizationService dan use case/middleware authz fase 7.
Dependensi: Role shared package dan enum effect dari schema RBAC.
Main Functions: Menyediakan query hemat biaya untuk daftar permission role dan override user yang masih efektif.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { Role } from '@lms-bimbel/shared'

export interface UserPermissionOverride {
  code: string
  effect: 'ALLOW' | 'DENY'
}

export interface IPermissionRepository {
  listRolePermissionCodes(role: Role): Promise<string[]>
  listEffectiveUserPermissionOverrides(userId: string, activeAt: Date): Promise<UserPermissionOverride[]>
}
