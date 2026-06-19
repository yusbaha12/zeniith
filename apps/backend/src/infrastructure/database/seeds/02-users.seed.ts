/*
Tujuan: Menyediakan data seed user fase 1 untuk seluruh role development lokal.
Caller: Runner seed database.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Mengekspor data user statis yang akan di-hash saat proses seed.
Side Effects: Tidak ada; hanya data untuk dipakai runner seed.
*/

export const usersSeed = [
  {
    id: '22222222-0000-0000-0000-000000000001',
    branchId: null,
    name: 'Super Admin',
    email: 'superadmin@lms-bimbel.id',
    password: 'Admin@12345',
    role: 'SUPER_ADMIN',
    phone: '081200000001',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    branchId: '11111111-0000-0000-0000-000000000001',
    name: 'Admin Yogyakarta',
    email: 'admin.yogya@lms-bimbel.id',
    password: 'Admin@12345',
    role: 'BRANCH_ADMIN',
    phone: '081200000002',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000003',
    branchId: '11111111-0000-0000-0000-000000000002',
    name: 'Admin Semarang',
    email: 'admin.smg@lms-bimbel.id',
    password: 'Admin@12345',
    role: 'BRANCH_ADMIN',
    phone: '081200000003',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000004',
    branchId: '11111111-0000-0000-0000-000000000001',
    name: 'Bu Sari Dewi',
    email: 'guru.sari@lms-bimbel.id',
    password: 'Guru@12345',
    role: 'TEACHER',
    phone: '081200000004',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000005',
    branchId: '11111111-0000-0000-0000-000000000001',
    name: 'Pak Rudi Hartono',
    email: 'guru.rudi@lms-bimbel.id',
    password: 'Guru@12345',
    role: 'TEACHER',
    phone: '081200000005',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000006',
    branchId: '11111111-0000-0000-0000-000000000001',
    name: 'Budi Santoso',
    email: 'murid@lms-bimbel.id',
    password: 'Murid@12345',
    role: 'STUDENT',
    phone: '081200000006',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000007',
    branchId: '11111111-0000-0000-0000-000000000001',
    name: 'Ani Rahayu',
    email: 'ani@lms-bimbel.id',
    password: 'Murid@12345',
    role: 'STUDENT',
    phone: '081200000007',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000008',
    branchId: '11111111-0000-0000-0000-000000000002',
    name: 'Candra Wibowo',
    email: 'candra@lms-bimbel.id',
    password: 'Murid@12345',
    role: 'STUDENT',
    phone: '081200000008',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000009',
    branchId: '11111111-0000-0000-0000-000000000002',
    name: 'Dewi Permata',
    email: 'dewi@lms-bimbel.id',
    password: 'Murid@12345',
    role: 'STUDENT',
    phone: '081200000009',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000010',
    branchId: '11111111-0000-0000-0000-000000000001',
    name: 'Eko Prasetyo',
    email: 'murid.expired@lms-bimbel.id',
    password: 'Murid@12345',
    role: 'STUDENT',
    phone: '081200000010',
    isActive: true
  },
  {
    id: '22222222-0000-0000-0000-000000000011',
    branchId: '11111111-0000-0000-0000-000000000001',
    name: 'Fajar Nugroho',
    email: 'murid.inactive@lms-bimbel.id',
    password: 'Murid@12345',
    role: 'STUDENT',
    phone: '081200000011',
    isActive: false
  }
] as const
