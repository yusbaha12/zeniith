/*
Tujuan: Menyediakan module API frontend fase 3 untuk student materials dan teacher CRUD materi.
Caller: Halaman murid `/student/materi*`, halaman guru `/teacher/materi*`, dan editor Tiptap.
Dependensi: API client serta tipe material frontend.
Main Functions: Mengambil subject/module/material, simpan progress, CRUD materi guru, dan upload image editor.
Side Effects: Melakukan HTTP call ke backend `/api/subjects`, `/api/materials`, dan `/api/teacher/materials`.
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

export const materialApi = {
  listSubjects: () => apiClient.get<FrontendSubject[]>('/subjects'),
  listModules: (subjectId: string) => apiClient.get<FrontendModule[]>(`/subjects/${subjectId}/modules`),
  listMaterialsByModule: (moduleId: string) => apiClient.get<FrontendModuleMaterials>(`/modules/${moduleId}/materials`),
  getMaterialDetail: (materialId: string) => apiClient.get<FrontendMaterialDetail>(`/materials/${materialId}`),
  trackProgress: (materialId: string, progressPercent: number, isCompleted: boolean) =>
    apiClient.post<{ materialId: string; progressPercent: number; isCompleted: boolean }>(
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
    apiClient.post<{ objectKey: string; url: string }>('/teacher/materials/assets/image', payload)
}
