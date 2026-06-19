/*
Tujuan: Menyediakan wrapper fetch dasar untuk komunikasi frontend ke backend fase 2.
Caller: API module frontend dan route/component yang butuh akses HTTP.
Dependensi: Environment variable VITE_API_URL dan kontrak ApiResponse.
Main Functions: Menangani request JSON/multipart berbasis cookie session, header opsional, normalisasi error backend, dan fallback aman saat backend mengembalikan non-JSON.
Side Effects: Melakukan HTTP call ke backend dan dapat melempar error saat response gagal atau payload tidak valid.
*/

import type { ApiResponse } from '$lib/domain/types/http.types'

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return `http://${hostname}:3000/api`
    }
  }
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
}

const API_BASE_URL = getApiBaseUrl()

type RequestOptions = RequestInit & {
  token?: string | null
}

const parseApiResponse = <T>(rawText: string): ApiResponse<T | null> | null => {
  if (!rawText.trim()) {
    return null
  }

  try {
    return JSON.parse(rawText) as ApiResponse<T | null>
  } catch {
    return null
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, body, ...restOptions } = options
  const isFormData = body instanceof FormData

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      body,
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers
      }
    })
  } catch (error) {
    console.error('[ApiClient] Network error:', error)
    throw new Error('Koneksi ke server terputus. Silakan periksa jaringan Anda atau coba beberapa saat lagi.')
  }

  const rawText = await response.text()
  const result = parseApiResponse<T>(rawText)

  if (!response.ok) {
    throw new Error(result?.message || rawText || 'Permintaan ke server gagal diproses')
  }

  if (!result) {
    throw new Error('Respons server tidak valid. Pastikan backend dev berjalan normal.')
  }

  if (!result.success) {
    throw new Error(result.message || 'Permintaan ke server gagal diproses')
  }

  return result.data as T
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, options),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    })
}
