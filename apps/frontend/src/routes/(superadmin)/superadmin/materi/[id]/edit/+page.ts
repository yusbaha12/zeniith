/*
Tujuan: Menyediakan parameter edit materi superadmin.
Caller: Route `/superadmin/materi/[id]/edit`.
Dependensi: Params route SvelteKit.
Main Functions: Meneruskan `materialId` ke halaman edit.
Side Effects: Tidak ada; load ringan tanpa HTTP call.
*/

export const load = async ({ params }) => ({
  materialId: params.id
})
