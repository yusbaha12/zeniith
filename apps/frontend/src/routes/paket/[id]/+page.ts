/*
Tujuan: Menyediakan parameter route paket detail untuk halaman detail paket fase 2.
Caller: Route publik `/paket/[id]`.
Dependensi: SvelteKit params route.
Main Functions: Meneruskan `packageId` ke komponen halaman detail.
Side Effects: Tidak ada; load ringan tanpa HTTP call.
*/

export const load = async ({ params }) => ({
  packageId: params.id
})
