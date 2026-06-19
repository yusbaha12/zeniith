/*
Tujuan: Menyediakan kontrak payload auth frontend fase 1.
Caller: Auth API, auth store, dan halaman login/daftar.
Dependensi: FrontendUser.
Main Functions: Menstandarkan payload login/register/refresh dan input form auth.
Side Effects: Tidak ada; file type murni.
*/

import type { FrontendUser } from './user.types'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  phone: string
  branchId: string
}

export interface LoginResponse {
  accessToken: string
  user: FrontendUser
}

export type RefreshResponse = LoginResponse
