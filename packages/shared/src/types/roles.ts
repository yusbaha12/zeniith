/*
Tujuan: Menyediakan konstanta role dan label role lintas aplikasi.
Caller: Middleware backend, guard frontend, dan komponen UI.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menentukan daftar role canonical dan label Bahasa Indonesia.
Side Effects: Tidak ada; file konstanta murni.
*/

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  BRANCH_ADMIN: 'Admin Cabang',
  TEACHER: 'Guru',
  STUDENT: 'Murid'
}
