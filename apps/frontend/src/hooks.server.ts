/*
Tujuan: Menyinkronkan sesi user ke `locals` untuk request frontend fase 1.
Caller: SvelteKit request lifecycle.
Dependensi: Helper auth-session server.
Main Functions: Membaca cookie sesi dari request lalu memuat user aktif bila tersedia.
Side Effects: Melakukan HTTP call server-side ke backend `/api/me`.
*/

import type { Handle } from '@sveltejs/kit'

import { loadSessionUser } from '$lib/server/auth-session'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = await loadSessionUser(event.fetch, event.request.headers.get('cookie'))
  return resolve(event)
}
