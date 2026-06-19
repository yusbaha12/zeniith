/*
Tujuan: Mencegah user yang sudah login membuka halaman daftar lagi.
Caller: Request server-side ke route `/daftar`.
Dependensi: Helper session server dan redirect role.
Main Functions: Mengecek sesi user lalu redirect ke dashboard role bila sudah login.
Side Effects: Melakukan HTTP call server-side ke backend `/api/me`.
*/

import { redirect } from '@sveltejs/kit'

import { getDashboardPathByRole } from '$lib/domain/types/user.types'
import { loadSessionUser } from '$lib/server/auth-session'

export const load = async ({ fetch, request }) => {
  const user = await loadSessionUser(fetch, request.headers.get('cookie'))

  if (user) {
    throw redirect(303, getDashboardPathByRole(user.role))
  }

  return {}
}
