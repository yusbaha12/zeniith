/*
Tujuan: Menjadi entry konfigurasi Vite untuk frontend SvelteKit fase 0.
Caller: Script dev, build, dan preview frontend.
Dependensi: @sveltejs/kit/vite dan @tailwindcss/vite.
Main Functions: Mengaktifkan plugin SvelteKit dan Tailwind CSS v4 untuk workflow frontend.
Side Effects: Mengontrol pipeline bundling dan dev server frontend.
*/

import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
})
