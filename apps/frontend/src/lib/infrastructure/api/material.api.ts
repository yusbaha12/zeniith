/*
Tujuan: Menyediakan module API frontend fase 3/7 untuk student materials, reward progress, teacher CRUD materi, dan superadmin CRUD materi.
Caller: Halaman murid `/student/materi*`, halaman guru `/teacher/materi*`, halaman superadmin `/superadmin/materi*`, dan editor Tiptap.
Dependensi: API client serta tipe material frontend.
Main Functions: Mengambil subject/module/material, simpan progress beserta reward gamifikasi, CRUD materi guru/admin, dan upload image editor.
Side Effects: Melakukan HTTP call ke backend `/api/subjects`, `/api/materials`, `/api/teacher/materials`, dan `/api/superadmin/materials`.
*/

import type {
  FrontendMaterialDetail,
  FrontendModule,
  FrontendModuleMaterials,
  FrontendSubject,
  TeacherMaterialDetail,
  TeacherMaterialListItem
} from '$lib/domain/types/material.types'

import { apiClient } from './client'

interface MaterialProgressReward {
  applied: boolean
  xpDelta?: number
}

interface MaterialProgressResponse {
  materialId: string
  progressPercent: number
  isCompleted: boolean
  gamificationReward: MaterialProgressReward | null
}

const buildQuery = (params: Record<string, string | boolean | undefined>) => {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export const materialApi = {
  listSubjects: () => apiClient.get<FrontendSubject[]>('/subjects'),
  listModules: (subjectId: string) => apiClient.get<FrontendModule[]>(`/subjects/${subjectId}/modules`),
  listMaterialsByModule: (moduleId: string) => apiClient.get<FrontendModuleMaterials>(`/modules/${moduleId}/materials`),
  getMaterialDetail: (materialId: string) => apiClient.get<FrontendMaterialDetail>(`/materials/${materialId}`),
  trackProgress: (materialId: string, progressPercent: number, isCompleted: boolean) =>
    apiClient.post<MaterialProgressResponse>(
      `/materials/${materialId}/progress`,
      { progressPercent, isCompleted }
    ),
  listTeacherMaterials: (moduleId?: string) =>
    apiClient.get<TeacherMaterialListItem[]>(`/teacher/materials${moduleId ? `?moduleId=${moduleId}` : ''}`),
  getTeacherMaterialDetail: (materialId: string) =>
    apiClient.get<TeacherMaterialDetail>(`/teacher/materials/${materialId}`),
  createTeacherMaterial: (payload: FormData) =>
    apiClient.post<{ id: string; moduleId: string; title: string }>('/teacher/materials', payload),
  updateTeacherMaterial: (materialId: string, payload: FormData) =>
    apiClient.patch<{ id: string; moduleId: string; title: string }>(`/teacher/materials/${materialId}`, payload),
  deleteTeacherMaterial: (materialId: string) =>
    apiClient.delete<{ id: string }>(`/teacher/materials/${materialId}`),
  uploadTeacherImage: (payload: FormData) =>
    apiClient.post<{ objectKey: string; url: string }>('/teacher/materials/assets/image', payload),
  listSuperadminMaterials: (filters: { moduleId?: string; subjectId?: string; isPublished?: boolean; q?: string } = {}) =>
    apiClient.get<TeacherMaterialListItem[]>(`/superadmin/materials${buildQuery(filters)}`),
  getSuperadminMaterialDetail: (materialId: string) =>
    apiClient.get<TeacherMaterialDetail>(`/superadmin/materials/${materialId}`),
  createSuperadminMaterial: (payload: FormData) =>
    apiClient.post<{ id: string; moduleId: string; title: string }>('/superadmin/materials', payload),
  updateSuperadminMaterial: (materialId: string, payload: FormData) =>
    apiClient.patch<{ id: string; moduleId: string; title: string }>(`/superadmin/materials/${materialId}`, payload),
  deleteSuperadminMaterial: (materialId: string) =>
    apiClient.delete<{ id: string }>(`/superadmin/materials/${materialId}`),
  uploadSuperadminImage: (payload: FormData) =>
    apiClient.post<{ objectKey: string; url: string }>('/superadmin/materials/assets/image', payload)
}
