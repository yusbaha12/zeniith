/*
Tujuan: Menyediakan data seed subject, module, dan material fase 3 untuk development lokal.
Caller: Runner seed database.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Mengekspor data ruang belajar awal agar murid dan guru punya materi untuk diuji.
Side Effects: Tidak ada; hanya data statis untuk dipakai runner seed.
*/

const makeTextContent = (title: string, paragraphs: string[]) => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: title }]
    },
    ...paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }]
    }))
  ]
})

export const subjectsSeed = [
  {
    id: '55555555-0000-0000-0000-000000000001',
    name: 'Matematika',
    slug: 'matematika',
    description: 'Konsep inti matematika untuk persiapan try out dan ujian.',
    sortOrder: 1,
    isActive: true
  },
  {
    id: '55555555-0000-0000-0000-000000000002',
    name: 'Bahasa Inggris',
    slug: 'bahasa-inggris',
    description: 'Strategi reading, grammar, dan vocabulary bertahap.',
    sortOrder: 2,
    isActive: true
  },
  {
    id: '55555555-0000-0000-0000-000000000003',
    name: 'Fisika',
    slug: 'fisika',
    description: 'Materi konsep dan latihan soal dasar fisika sekolah.',
    sortOrder: 3,
    isActive: true
  }
] as const

export const modulesSeed = [
  {
    id: '66666666-0000-0000-0000-000000000001',
    subjectId: '55555555-0000-0000-0000-000000000001',
    title: 'Aljabar Dasar',
    slug: 'aljabar-dasar',
    description: 'Persamaan linear, operasi bentuk aljabar, dan substitusi.',
    sortOrder: 1,
    isActive: true
  },
  {
    id: '66666666-0000-0000-0000-000000000002',
    subjectId: '55555555-0000-0000-0000-000000000001',
    title: 'Geometri Dasar',
    slug: 'geometri-dasar',
    description: 'Bangun datar, bangun ruang, dan sudut.',
    sortOrder: 2,
    isActive: true
  },
  {
    id: '66666666-0000-0000-0000-000000000003',
    subjectId: '55555555-0000-0000-0000-000000000002',
    title: 'Reading Strategy',
    slug: 'reading-strategy',
    description: 'Teknik skimming, scanning, dan context clues.',
    sortOrder: 1,
    isActive: true
  },
  {
    id: '66666666-0000-0000-0000-000000000004',
    subjectId: '55555555-0000-0000-0000-000000000002',
    title: 'Grammar Essentials',
    slug: 'grammar-essentials',
    description: 'Tenses, subject-verb agreement, dan clause basics.',
    sortOrder: 2,
    isActive: true
  },
  {
    id: '66666666-0000-0000-0000-000000000005',
    subjectId: '55555555-0000-0000-0000-000000000003',
    title: 'Kinematika',
    slug: 'kinematika',
    description: 'Gerak lurus, grafik, dan analisis dasar.',
    sortOrder: 1,
    isActive: true
  },
  {
    id: '66666666-0000-0000-0000-000000000006',
    subjectId: '55555555-0000-0000-0000-000000000003',
    title: 'Dinamika',
    slug: 'dinamika',
    description: 'Gaya, hukum Newton, dan aplikasi sederhana.',
    sortOrder: 2,
    isActive: true
  }
] as const

export const materialsSeed = [
  {
    id: '77777777-0000-0000-0000-000000000001',
    moduleId: '66666666-0000-0000-0000-000000000001',
    branchId: '11111111-0000-0000-0000-000000000001',
    createdBy: '22222222-0000-0000-0000-000000000004',
    title: 'Konsep Dasar Bentuk Aljabar',
    slug: 'konsep-dasar-bentuk-aljabar',
    summary: 'Memahami suku, koefisien, variabel, dan konstanta.',
    materialType: 'TEXT',
    contentJson: makeTextContent('Konsep Dasar Bentuk Aljabar', [
      'Bentuk aljabar terdiri dari variabel, koefisien, suku, dan konstanta.',
      'Langkah awal yang perlu dikuasai adalah mengelompokkan suku sejenis sebelum melakukan operasi hitung.'
    ]),
    attachmentObjectKey: null,
    attachmentFileName: null,
    attachmentContentType: null,
    estimatedDurationMinutes: 20,
    sortOrder: 1,
    isPublished: true
  },
  {
    id: '77777777-0000-0000-0000-000000000002',
    moduleId: '66666666-0000-0000-0000-000000000001',
    branchId: '11111111-0000-0000-0000-000000000001',
    createdBy: '22222222-0000-0000-0000-000000000004',
    title: 'Latihan Suku Sejenis',
    slug: 'latihan-suku-sejenis',
    summary: 'Latihan mandiri operasi bentuk aljabar sederhana.',
    materialType: 'EXERCISE',
    contentJson: makeTextContent('Latihan Suku Sejenis', [
      'Sederhanakan 3x + 5x - 2.',
      'Sederhanakan 4a + 2b - 3a + b.'
    ]),
    attachmentObjectKey: null,
    attachmentFileName: null,
    attachmentContentType: null,
    estimatedDurationMinutes: 15,
    sortOrder: 2,
    isPublished: true
  },
  {
    id: '77777777-0000-0000-0000-000000000003',
    moduleId: '66666666-0000-0000-0000-000000000003',
    branchId: '11111111-0000-0000-0000-000000000001',
    createdBy: '22222222-0000-0000-0000-000000000005',
    title: 'Skimming and Scanning',
    slug: 'skimming-and-scanning',
    summary: 'Teknik membaca cepat untuk menemukan ide pokok dan detail.',
    materialType: 'TEXT',
    contentJson: makeTextContent('Skimming and Scanning', [
      'Skimming digunakan untuk menemukan gambaran besar sebuah teks.',
      'Scanning digunakan untuk mencari detail tertentu seperti angka, tanggal, atau nama.'
    ]),
    attachmentObjectKey: null,
    attachmentFileName: null,
    attachmentContentType: null,
    estimatedDurationMinutes: 18,
    sortOrder: 1,
    isPublished: true
  },
  {
    id: '77777777-0000-0000-0000-000000000004',
    moduleId: '66666666-0000-0000-0000-000000000004',
    branchId: '11111111-0000-0000-0000-000000000001',
    createdBy: '22222222-0000-0000-0000-000000000005',
    title: 'Simple Present vs Present Continuous',
    slug: 'simple-present-vs-present-continuous',
    summary: 'Perbedaan fungsi dan contoh penggunaan dua tense paling dasar.',
    materialType: 'TEXT',
    contentJson: makeTextContent('Simple Present vs Present Continuous', [
      'Simple Present digunakan untuk fakta umum dan kebiasaan.',
      'Present Continuous digunakan untuk kejadian yang sedang berlangsung saat ini.'
    ]),
    attachmentObjectKey: null,
    attachmentFileName: null,
    attachmentContentType: null,
    estimatedDurationMinutes: 16,
    sortOrder: 1,
    isPublished: true
  },
  {
    id: '77777777-0000-0000-0000-000000000005',
    moduleId: '66666666-0000-0000-0000-000000000005',
    branchId: '11111111-0000-0000-0000-000000000001',
    createdBy: '22222222-0000-0000-0000-000000000004',
    title: 'Gerak Lurus Beraturan',
    slug: 'gerak-lurus-beraturan',
    summary: 'Konsep dasar kecepatan konstan dan grafik sederhana.',
    materialType: 'TEXT',
    contentJson: makeTextContent('Gerak Lurus Beraturan', [
      'Pada GLB, kecepatan benda bernilai konstan sehingga percepatannya nol.',
      'Hubungan jarak, kecepatan, dan waktu dapat dituliskan s = v × t.'
    ]),
    attachmentObjectKey: null,
    attachmentFileName: null,
    attachmentContentType: null,
    estimatedDurationMinutes: 22,
    sortOrder: 1,
    isPublished: true
  }
] as const
