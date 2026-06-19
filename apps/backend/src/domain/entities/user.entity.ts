/*
Tujuan: Merepresentasikan entitas user untuk auth, profile, dan branch scope fase 1.
Caller: User repository, auth service, dan use case auth/profile.
Dependensi: Role shared package.
Main Functions: Menyimpan data user serta helper role, status aktif, dan payload profil aman.
Side Effects: Tidak ada; entitas domain murni.
*/

import type { Role } from '@lms-bimbel/shared'

export interface SafeUserProfile {
  id: string
  branchId: string | null
  name: string
  email: string
  phone: string | null
  role: Role
  avatarUrl: string | null
  isActive: boolean
}

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly branchId: string | null,
    public readonly name: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly phone: string | null,
    public readonly role: Role,
    public readonly avatarUrl: string | null,
    public readonly isActive: boolean,
    public readonly createdAt?: Date
  ) {}

  isStudent(): boolean {
    return this.role === 'STUDENT'
  }

  isAdmin(): boolean {
    return this.role === 'SUPER_ADMIN' || this.role === 'BRANCH_ADMIN'
  }

  canAccessBranch(branchId: string | null): boolean {
    if (this.role === 'SUPER_ADMIN') {
      return true
    }

    return this.branchId === branchId
  }

  toSafeProfile(): SafeUserProfile {
    return {
      id: this.id,
      branchId: this.branchId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      avatarUrl: this.avatarUrl,
      isActive: this.isActive
    }
  }
}
