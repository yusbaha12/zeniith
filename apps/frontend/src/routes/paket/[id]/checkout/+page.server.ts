/*
Tujuan: Menjaga halaman checkout paket agar hanya bisa diakses murid yang sudah login.
Caller: Route `/paket/[id]/checkout`.
Dependensi: Helper requireRole server.
Main Functions: Memuat user sesi student dan meneruskan `packageId` ke halaman checkout.
Side Effects: Melakukan HTTP call server-side ke backend `/api/me` untuk validasi sesi.
*/

import { requireRole } from '$lib/server/auth-session'

export const load = async ({ fetch, request, params }) => ({
  user: await requireRole(fetch, request.headers.get('cookie'), ['STUDENT']),
  packageId: params.id
})
