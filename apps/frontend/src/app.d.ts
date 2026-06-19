/*
Tujuan: Mendefinisikan tipe global SvelteKit untuk sesi user fase 1.
Caller: hooks.server, layout server load, dan route protected frontend.
Dependensi: Tipe user frontend.
Main Functions: Menyediakan tipe `App.Locals` agar auth guard server-side konsisten.
Side Effects: Tidak ada; file deklarasi tipe global.
*/

import type { FrontendUser } from '$lib/domain/types/user.types'

declare global {
  namespace App {
    interface Locals {
      user: FrontendUser | null
    }
  }
}

export {}
