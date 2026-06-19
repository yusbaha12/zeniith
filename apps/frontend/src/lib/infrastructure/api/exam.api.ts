/*
Tujuan: Menyediakan module API frontend fase 4 untuk student tryout dan teacher CRUD ujian.
Caller: Halaman murid `/student/tryout*` dan halaman guru `/teacher/ujian*`.
Dependensi: API client serta tipe exam frontend.
Main Functions: Mengambil ujian, memulai sesi, submit jawaban/ujian, ambil hasil, dan CRUD ujian guru.
Side Effects: Melakukan HTTP call ke backend `/api/exams`, `/api/sessions`, dan `/api/teacher/exams`.
*/

import type {
  FrontendExamDetail,
  FrontendExamQuestion,
  FrontendExamListItem,
  FrontendLeaderboardSnapshot,
  FrontendExamResultPayload,
  FrontendSessionSnapshot,
  FrontendStartExamPayload,
  FrontendTeacherExamDetail,
  FrontendTeacherExamListItem
} from '$lib/domain/types/exam.types'

import { apiClient } from './client'

export const examApi = {
  listExams: () => apiClient.get<FrontendExamListItem[]>('/exams'),
  getExamDetail: (examId: string) => apiClient.get<FrontendExamDetail>(`/exams/${examId}`),
  getExamLeaderboard: (examId: string) => apiClient.get<FrontendLeaderboardSnapshot>(`/exams/${examId}/leaderboard`),
  startExam: (examId: string) => apiClient.post<FrontendStartExamPayload>(`/exams/${examId}/sessions`),
  getSessionSnapshot: (sessionId: string) => apiClient.get<FrontendSessionSnapshot>(`/sessions/${sessionId}`),
  submitAnswer: (
    sessionId: string,
    payload: {
      questionId: string
      selectedOptionId?: string | null
      answerText?: string | null
      isMarkedDoubt?: boolean
      idempotencyKey: string
    }
  ) => apiClient.post<{ accepted: boolean; duplicate?: boolean; message?: string }>(`/sessions/${sessionId}/answers`, payload),
  submitExam: (sessionId: string) => apiClient.post<{ sessionId: string; status: 'SUBMITTED' }>(`/sessions/${sessionId}/submit`),
  getExamResult: (sessionId: string) => apiClient.get<FrontendExamResultPayload>(`/sessions/${sessionId}/result`),
  getAdaptiveRecommendation: () => apiClient.get<any>('/student/adaptive-recommendation'),
  listTeacherExams: () => apiClient.get<FrontendTeacherExamListItem[]>('/teacher/exams'),
  getTeacherExamDetail: (examId: string) => apiClient.get<FrontendTeacherExamDetail>(`/teacher/exams/${examId}`),
  createTeacherExam: (payload: {
    subjectId?: string | null
    title: string
    description?: string | null
    instructions?: string | null
    examType: 'TRYOUT' | 'LATIHAN' | 'MID_EXAM' | 'FINAL_EXAM'
    durationMinutes: number
    startsAt: string
    endsAt: string
    isPublished: boolean
  }) => apiClient.post<FrontendExamDetail>('/teacher/exams', payload),
  createTeacherQuestion: (examId: string, payload: Record<string, unknown>) =>
    apiClient.post<FrontendExamQuestion>(`/teacher/exams/${examId}/questions`, payload),
  updateTeacherQuestion: (questionId: string, payload: Record<string, unknown>) =>
    apiClient.patch<FrontendExamQuestion>(`/teacher/questions/${questionId}`, payload),
  getLiveProctorData: (examId: string) => apiClient.get<any[]>(`/teacher/exams/${examId}/proctor`),
  getProctorLog: (sessionId: string) => apiClient.get<any[]>(`/teacher/sessions/${sessionId}/proctor-log`),
  terminateSession: (sessionId: string) => apiClient.post<any>(`/teacher/sessions/${sessionId}/terminate`),
  warnStudent: (sessionId: string, payload: { userId: string; message: string }) => 
    apiClient.post<any>(`/teacher/sessions/${sessionId}/warn`, payload),
  superadminListExams: () => apiClient.get<FrontendTeacherExamListItem[]>('/superadmin/exams'),
  superadminGetExamDetail: (examId: string) => apiClient.get<{ exam: any; questions: any[] }>(`/superadmin/exams/${examId}`),
  superadminCreateQuestion: (examId: string, payload: Record<string, unknown>) =>
    apiClient.post<any>(`/superadmin/exams/${examId}/questions`, payload),
  superadminUpdateQuestion: (questionId: string, payload: Record<string, unknown>) =>
    apiClient.patch<any>(`/superadmin/questions/${questionId}`, payload)
}
