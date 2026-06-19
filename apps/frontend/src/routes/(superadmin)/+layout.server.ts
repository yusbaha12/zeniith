/*
Tujuan: Menjaga area superadmin agar hanya bisa diakses super admin yang sudah login.
Caller: Semua request route group `(superadmin)`.
Dependensi: Helper requireRole server.
Main Functions: Memuat user sesi dan redirect bila role tidak sesuai.
Side Effects: Melakukan HTTP call server-side ke backend `/api/me`.
*/

import { requireRole } from '$lib/server/auth-session'

export const load = async ({ fetch, request }) => ({
  user: await requireRole(fetch, request.headers.get('cookie'), ['SUPER_ADMIN'])
})
