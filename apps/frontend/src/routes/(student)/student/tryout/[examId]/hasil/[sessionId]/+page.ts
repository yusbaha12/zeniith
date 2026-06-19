/*
Tujuan: Menyediakan parameter route examId dan sessionId untuk halaman hasil ujian murid.
Caller: Route `/student/tryout/[examId]/hasil/[sessionId]`.
Dependensi: SvelteKit params.
Main Functions: Meneruskan identitas ujian dan sesi ke halaman hasil.
Side Effects: Tidak ada; hanya data route.
*/

export const load = async ({ params }: { params: { examId: string; sessionId: string } }) => ({
  examId: params.examId,
  sessionId: params.sessionId
})

