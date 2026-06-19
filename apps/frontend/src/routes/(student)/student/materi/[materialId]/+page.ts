/*
Tujuan: Menyediakan parameter material detail untuk halaman baca materi murid fase 3.
Caller: Route `/student/materi/[materialId]`.
Dependensi: Params route SvelteKit.
Main Functions: Meneruskan `materialId` ke komponen detail materi.
Side Effects: Tidak ada; load ringan tanpa HTTP call.
*/

export const load = async ({ params }) => ({
  materialId: params.materialId
})
