/*
Tujuan: Menyediakan helper pembacaan response API untuk fetch manual agar error backend tampil sebagai pesan manusiawi.
Caller: Route Svelte yang masih memakai native fetch untuk aksi CRUD/admin.
Dependensi: Kontrak ApiResponse frontend.
Main Functions: `readApiData` untuk parse JSON/text, normalisasi message, dan lempar Error saat response gagal.
Side Effects: Membaca body Response sekali dan dapat melempar Error untuk response gagal.
*/

import type { ApiResponse } from '$lib/domain/types/http.types'

const parseJson = <T>(rawText: string): ApiResponse<T | null> | null => {
  if (!rawText.trim()) return null

  try {
    return JSON.parse(rawText) as ApiResponse<T | null>
  } catch {
    return null
  }
}

const normalizeMessage = (message: string | undefined, fallback: string) => {
  if (!message) return fallback

  const parsed = parseJson<unknown>(message)
  return parsed?.message || message || fallback
}

export async function readApiData<T = unknown>(response: Response, fallbackMessage: string): Promise<T | null> {
  const rawText = await response.text()
  const result = parseJson<T>(rawText)
  const message = normalizeMessage(result?.message || rawText, fallbackMessage)

  if (!response.ok || result?.success === false) {
    throw new Error(message)
  }

  return (result?.data ?? null) as T | null
}
