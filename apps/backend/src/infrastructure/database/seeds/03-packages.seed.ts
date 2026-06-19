/*
Tujuan: Menyediakan data seed paket dan fitur paket fase 2 untuk development lokal.
Caller: Runner seed database.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Mengekspor data 3 paket belajar dan fitur-fitur utamanya.
Side Effects: Tidak ada; hanya data statis untuk dipakai runner seed.
*/

export const packagesSeed = [
  {
    id: '33333333-0000-0000-0000-000000000001',
    slug: 'reguler',
    name: 'Paket Reguler',
    description: 'Pilihan hemat untuk murid yang ingin belajar terstruktur dengan akses materi inti.',
    type: 'REGULER',
    price: 299000,
    durationDays: 30,
    isActive: true,
    sortOrder: 1
  },
  {
    id: '33333333-0000-0000-0000-000000000002',
    slug: 'intensif',
    name: 'Paket Intensif',
    description: 'Paket paling seimbang untuk persiapan try out dengan materi dan evaluasi lebih sering.',
    type: 'INTENSIF',
    price: 599000,
    durationDays: 60,
    isActive: true,
    sortOrder: 2
  },
  {
    id: '33333333-0000-0000-0000-000000000003',
    slug: 'premium',
    name: 'Paket Premium',
    description: 'Paket lengkap dengan semua fitur unggulan, monitoring progres, dan prioritas try out.',
    type: 'PREMIUM',
    price: 999000,
    durationDays: 90,
    isActive: true,
    sortOrder: 3
  }
] as const

export const packageFeaturesSeed = [
  {
    id: '44444444-0000-0000-0000-000000000001',
    packageId: '33333333-0000-0000-0000-000000000001',
    title: 'Akses materi inti semua mapel',
    description: 'Materi video dan PDF dasar untuk mapel utama.',
    sortOrder: 1
  },
  {
    id: '44444444-0000-0000-0000-000000000002',
    packageId: '33333333-0000-0000-0000-000000000001',
    title: '1 try out bulanan',
    description: 'Try out dasar untuk evaluasi progres belajar.',
    sortOrder: 2
  },
  {
    id: '44444444-0000-0000-0000-000000000003',
    packageId: '33333333-0000-0000-0000-000000000002',
    title: 'Semua fitur paket reguler',
    description: 'Seluruh materi inti dan evaluasi dasar tetap aktif.',
    sortOrder: 1
  },
  {
    id: '44444444-0000-0000-0000-000000000004',
    packageId: '33333333-0000-0000-0000-000000000002',
    title: '4 try out terjadwal',
    description: 'Lebih banyak kesempatan evaluasi untuk persiapan ujian.',
    sortOrder: 2
  },
  {
    id: '44444444-0000-0000-0000-000000000005',
    packageId: '33333333-0000-0000-0000-000000000002',
    title: 'Progress belajar lebih detail',
    description: 'Pantau progres modul belajar secara lebih rinci.',
    sortOrder: 3
  },
  {
    id: '44444444-0000-0000-0000-000000000006',
    packageId: '33333333-0000-0000-0000-000000000003',
    title: 'Semua fitur paket intensif',
    description: 'Akses penuh seluruh materi dan try out reguler/intensif.',
    sortOrder: 1
  },
  {
    id: '44444444-0000-0000-0000-000000000007',
    packageId: '33333333-0000-0000-0000-000000000003',
    title: 'Prioritas try out nasional',
    description: 'Ikut try out skala nasional dan leaderboard prioritas.',
    sortOrder: 2
  },
  {
    id: '44444444-0000-0000-0000-000000000008',
    packageId: '33333333-0000-0000-0000-000000000003',
    title: 'Monitoring progres premium',
    description: 'Dashboard progres dan rekomendasi belajar lebih lengkap.',
    sortOrder: 3
  }
] as const
