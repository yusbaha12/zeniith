/*
Tujuan: Menandai semua route tak dikenal sebagai 404 di frontend fase 0.
Caller: SvelteKit router ketika path tidak cocok dengan route lain.
Dependensi: `error` helper dari @sveltejs/kit.
Main Functions: Melempar 404 agar root error page merender pesan yang konsisten.
Side Effects: Menghentikan rendering route dan mengembalikan status 404.
*/

import { error } from '@sveltejs/kit'

export const load = () => {
  throw error(404, 'Halaman yang Anda cari tidak ditemukan')
}
