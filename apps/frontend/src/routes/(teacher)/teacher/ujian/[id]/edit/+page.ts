/*
Tujuan: Menyediakan parameter route id untuk halaman edit ujian guru.
Caller: Route `/teacher/ujian/[id]/edit`.
Dependensi: SvelteKit params.
Main Functions: Meneruskan `id` ujian ke halaman edit.
Side Effects: Tidak ada; hanya data route.
*/

export const load = async ({ params }: { params: { id: string } }) => ({
  examId: params.id
})

