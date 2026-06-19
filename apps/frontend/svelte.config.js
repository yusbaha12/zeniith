/*
Tujuan: Mengonfigurasi adapter dan alias SvelteKit untuk frontend fase 0.
Caller: Vite, SvelteKit build, dan `svelte-kit sync`.
Dependensi: @sveltejs/adapter-auto dan path source frontend/shared.
Main Functions: Menentukan adapter default dan alias modul seperti `$lib`.
Side Effects: Memengaruhi resolusi import dan target build frontend.
*/

import adapter from '@sveltejs/adapter-auto'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      $lib: './src/lib',
      '@shared': '../../packages/shared/src'
    }
  }
}

export default config
