/*
Tujuan: Menyediakan data seed ujian fase 4 untuk try out aktif dan bank soal awal development lokal.
Caller: Runner seed database.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Mengekspor builder data ujian, soal, dan opsi agar smoke test fase 4 punya data siap pakai.
Side Effects: Tidak ada; hanya data statis/terhitung untuk dipakai runner seed.
*/

const paragraph = (text: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text }]
})

const questionTitle = (text: string) => ({
  type: 'doc',
  content: [paragraph(text)]
})

export const buildExamsSeed = (now: Date = new Date()) => {
  const startsAt = new Date(now.getTime() - (60 * 60 * 1000))
  const endsAt = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000))

  return {
    examsSeed: [
      {
        id: '88888888-0000-0000-0000-000000000001',
        branchId: '11111111-0000-0000-0000-000000000001',
        subjectId: '55555555-0000-0000-0000-000000000001',
        createdBy: '22222222-0000-0000-0000-000000000004',
        title: 'Try Out Aljabar Dasar 01',
        slug: 'try-out-aljabar-dasar-01',
        description: 'Try out dasar matematika untuk mengukur pemahaman aljabar.',
        instructions: 'Kerjakan semua soal dengan teliti. Pilih satu jawaban paling benar.',
        examType: 'TRYOUT' as const,
        durationMinutes: 45,
        totalQuestions: 2,
        totalScore: 20,
        startsAt,
        endsAt,
        isPublished: true
      }
    ],
    questionsSeed: [
      {
        id: '88999999-0000-0000-0000-000000000001',
        examId: '88888888-0000-0000-0000-000000000001',
        questionType: 'MULTIPLE_CHOICE' as const,
        contentJson: questionTitle('Hasil penyederhanaan 3x + 5x - 2x adalah ...'),
        explanationJson: questionTitle('Gabungkan suku sejenis: 3x + 5x - 2x = 6x.'),
        score: 10,
        sortOrder: 1
      },
      {
        id: '88999999-0000-0000-0000-000000000002',
        examId: '88888888-0000-0000-0000-000000000001',
        questionType: 'MULTIPLE_CHOICE' as const,
        contentJson: questionTitle('Jika x = 4, maka nilai dari 2x + 3 adalah ...'),
        explanationJson: questionTitle('Substitusi x = 4 menghasilkan 2(4) + 3 = 11.'),
        score: 10,
        sortOrder: 2
      }
    ],
    optionsSeed: [
      {
        id: '88000000-0000-0000-0000-000000000001',
        questionId: '88999999-0000-0000-0000-000000000001',
        optionKey: 'A',
        contentJson: questionTitle('5x'),
        isCorrect: false,
        sortOrder: 1
      },
      {
        id: '88000000-0000-0000-0000-000000000002',
        questionId: '88999999-0000-0000-0000-000000000001',
        optionKey: 'B',
        contentJson: questionTitle('6x'),
        isCorrect: true,
        sortOrder: 2
      },
      {
        id: '88000000-0000-0000-0000-000000000003',
        questionId: '88999999-0000-0000-0000-000000000001',
        optionKey: 'C',
        contentJson: questionTitle('7x'),
        isCorrect: false,
        sortOrder: 3
      },
      {
        id: '88000000-0000-0000-0000-000000000004',
        questionId: '88999999-0000-0000-0000-000000000001',
        optionKey: 'D',
        contentJson: questionTitle('8x'),
        isCorrect: false,
        sortOrder: 4
      },
      {
        id: '88000000-0000-0000-0000-000000000005',
        questionId: '88999999-0000-0000-0000-000000000002',
        optionKey: 'A',
        contentJson: questionTitle('9'),
        isCorrect: false,
        sortOrder: 1
      },
      {
        id: '88000000-0000-0000-0000-000000000006',
        questionId: '88999999-0000-0000-0000-000000000002',
        optionKey: 'B',
        contentJson: questionTitle('10'),
        isCorrect: false,
        sortOrder: 2
      },
      {
        id: '88000000-0000-0000-0000-000000000007',
        questionId: '88999999-0000-0000-0000-000000000002',
        optionKey: 'C',
        contentJson: questionTitle('11'),
        isCorrect: true,
        sortOrder: 3
      },
      {
        id: '88000000-0000-0000-0000-000000000008',
        questionId: '88999999-0000-0000-0000-000000000002',
        optionKey: 'D',
        contentJson: questionTitle('12'),
        isCorrect: false,
        sortOrder: 4
      }
    ]
  }
}
