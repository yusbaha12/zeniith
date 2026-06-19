/*
Tujuan: Menyediakan kontrak tipe user frontend dan helper redirect berdasarkan role.
Caller: Auth store, route guard, dashboard, dan halaman profil.
Dependensi: Role shared package.
Main Functions: Menstandarkan bentuk user hasil `/api/me` dan jalur dashboard tiap role.
Side Effects: Tidak ada; file type/helper murni.
*/

import type { Role } from '@lms-bimbel/shared'

export interface FrontendUser {
  id: string
  branchId: string | null
  name: string
  email: string
  phone: string | null
  role: Role
  avatarUrl: string | null
  isActive: boolean
  permissions?: string[]
}

export const getDashboardPathByRole = (role: Role): string => {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard'
    case 'TEACHER':
      return '/teacher/dashboard'
    case 'BRANCH_ADMIN':
      return '/admin/dashboard'
    case 'SUPER_ADMIN':
      return '/superadmin/dashboard'
  }
}
