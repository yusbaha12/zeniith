/*
Tujuan: Menyediakan parameter route id (examId) untuk halaman monitor proctoring guru.
Caller: Route `/teacher/ujian/[id]/monitor`.
Dependensi: SvelteKit params.
Main Functions: Meneruskan `id` (examId) ke halaman monitor.
Side Effects: Tidak ada; hanya data route.
*/

export const load = async ({ params }: { params: { id: string } }) => ({
  examId: params.id
})
