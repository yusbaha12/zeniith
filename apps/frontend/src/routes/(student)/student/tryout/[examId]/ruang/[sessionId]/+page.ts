/*
Tujuan: Menyediakan parameter route examId dan sessionId untuk ruang ujian murid.
Caller: Route `/student/tryout/[examId]/ruang/[sessionId]`.
Dependensi: SvelteKit params.
Main Functions: Meneruskan identitas ujian dan sesi ke halaman ruang ujian.
Side Effects: Tidak ada; hanya data route.
*/

export const load = async ({ params }: { params: { examId: string; sessionId: string } }) => ({
  examId: params.examId,
  sessionId: params.sessionId
})

