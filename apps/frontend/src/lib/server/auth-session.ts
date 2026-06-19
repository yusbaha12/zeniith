/*
Tujuan: Menyediakan helper server-side untuk membaca sesi user dan guard role frontend.
Caller: hooks.server, route layout server, dan page server login/daftar.
Dependensi: VITE_API_URL, tipe user frontend, dan helper redirect role.
Main Functions: Meneruskan cookie ke backend `/api/me` dan menentukan redirect role yang benar.
Side Effects: Melakukan HTTP call server-side ke backend auth endpoint.
*/

import { redirect } from '@sveltejs/kit'

import type { Role } from '@lms-bimbel/shared'
import type { FrontendUser } from '$lib/domain/types/user.types'
import { getDashboardPathByRole } from '$lib/domain/types/user.types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const loadSessionUser = async (
  fetchFn: typeof fetch,
  cookieHeader: string | null
): Promise<FrontendUser | null> => {
  if (!cookieHeader) {
    return null
  }

  const response = await fetchFn(`${API_BASE_URL}/me`, {
    headers: {
      cookie: cookieHeader
    }
  })

  if (!response.ok) {
    return null
  }

  const result = await response.json() as {
    success: boolean
    data: FrontendUser
  }

  return result.success ? result.data : null
}

export const requireRole = async (
  fetchFn: typeof fetch,
  cookieHeader: string | null,
  allowedRoles: Role[]
) => {
  const user = await loadSessionUser(fetchFn, cookieHeader)

  if (!user) {
    throw redirect(303, '/login')
  }

  if (!allowedRoles.includes(user.role)) {
    throw redirect(303, getDashboardPathByRole(user.role))
  }

  return user
}
