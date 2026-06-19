/*
Tujuan: Menyediakan adapter API frontend untuk daftar cabang aktif.
Caller: Halaman daftar dan form onboarding user baru.
Dependensi: apiClient dan tipe branch frontend.
Main Functions: Mengambil daftar cabang aktif dari backend.
Side Effects: Melakukan HTTP call publik ke backend.
*/

import type { FrontendBranch } from '$lib/domain/types/branch.types'

import { apiClient } from './client'

export const branchApi = {
  list: () => apiClient.get<FrontendBranch[]>('/branches')
}
