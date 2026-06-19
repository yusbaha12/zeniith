/*
Tujuan: Menyediakan adapter API frontend untuk login, register, refresh, logout, dan profile.
Caller: Auth store, halaman login/daftar, dan halaman profil.
Dependensi: apiClient serta tipe auth/user frontend.
Main Functions: Membungkus endpoint auth/profile backend menjadi fungsi frontend yang typed.
Side Effects: Melakukan HTTP call ke backend dengan kredensial cookie.
*/

import type { LoginInput, LoginResponse, RefreshResponse, RegisterInput } from '$lib/domain/types/auth.types'
import type { FrontendUser } from '$lib/domain/types/user.types'

import { apiClient } from './client'

export const authApi = {
  login: (input: LoginInput) => apiClient.post<LoginResponse>('/auth/login', input),
  register: (input: RegisterInput) => apiClient.post<FrontendUser>('/auth/register', input),
  refresh: () => apiClient.post<RefreshResponse>('/auth/refresh'),
  logout: () => apiClient.post<null>('/auth/logout'),
  me: () => apiClient.get<FrontendUser>('/me'),
  updateProfile: (input: { name: string; phone: string }) => apiClient.patch<FrontendUser>('/me', input),
  updatePassword: (input: { currentPassword: string; newPassword: string }) => apiClient.patch<null>('/me/password', input)
}
