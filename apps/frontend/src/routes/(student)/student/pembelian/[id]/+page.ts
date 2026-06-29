<!--
Tujuan: Menyediakan params loader untuk halaman detail order murid.
Caller: Route /student/pembelian/[id].
Dependensi: SvelteKit load function.
Main Functions: Mengekstrak orderId dari URL params dan meneruskannya ke +page.svelte.
Side Effects: Tidak ada side effect.
-->

import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => ({
  orderId: params.id
})
