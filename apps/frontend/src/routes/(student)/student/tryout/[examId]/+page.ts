/*
Tujuan: Menyediakan parameter route examId untuk halaman detail try out murid.
Caller: Route `/student/tryout/[examId]`.
Dependensi: SvelteKit params.
Main Functions: Meneruskan `examId` ke halaman detail try out.
Side Effects: Tidak ada; hanya data route.
*/

export const load = async ({ params }: { params: { examId: string } }) => ({
  examId: params.examId
})

