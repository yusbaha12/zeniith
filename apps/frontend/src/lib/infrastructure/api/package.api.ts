/*
Tujuan: Menyediakan module API frontend fase 2 untuk katalog dan detail paket belajar.
Caller: Halaman `/paket`, detail paket, dan checkout.
Dependensi: API client dan tipe package frontend.
Main Functions: Mengambil daftar paket aktif dan detail paket individual.
Side Effects: Melakukan HTTP call ke backend `/api/packages*`.
*/

import type { FrontendPackageDetail, FrontendPackageSummary, FrontendPackageFeature } from '$lib/domain/types/package.types'
import { apiClient } from './client'

export const packageApi = {
  list: () => apiClient.get<FrontendPackageSummary[]>('/packages'),
  detail: (packageId: string) => apiClient.get<FrontendPackageDetail>(`/packages/${packageId}`),

  // Superadmin Package Feature Management
  listFeatures: (packageId: string) =>
    apiClient.get<FrontendPackageFeature[]>(`/superadmin/packages/${packageId}/features`),
  createFeature: (packageId: string, data: { title: string; description?: string; sortOrder?: number }) =>
    apiClient.post<FrontendPackageFeature>(`/superadmin/packages/${packageId}/features`, data),
  updateFeature: (featureId: string, data: { title?: string; description?: string | null; sortOrder?: number }) =>
    apiClient.patch<FrontendPackageFeature>(`/superadmin/packages/features/${featureId}`, data),
  deleteFeature: (featureId: string) =>
    apiClient.delete<void>(`/superadmin/packages/features/${featureId}`),

  // Superadmin Package Curriculum (Subject) Mapping
  listSubjects: (packageId: string) =>
    apiClient.get<string[]>(`/superadmin/packages/${packageId}/subjects`),
  assignSubjects: (packageId: string, subjectIds: string[]) =>
    apiClient.post<void>(`/superadmin/packages/${packageId}/subjects`, { subjectIds })
}
