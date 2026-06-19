/*
Tujuan: Menyediakan data seed cabang fase 1 untuk development lokal.
Caller: Runner seed database.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Mengekspor data statis 5 cabang aktif sesuai dokumen seed proyek.
Side Effects: Tidak ada; hanya data untuk dipakai runner seed.
*/

export const branchesSeed = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    name: 'Yogyakarta Pusat',
    code: 'YOG',
    address: 'Jl. Malioboro No. 1, Yogyakarta',
    city: 'Yogyakarta',
    phone: '0274-555001',
    isActive: true
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    name: 'Semarang Barat',
    code: 'SMG',
    address: 'Jl. Pemuda No. 45, Semarang',
    city: 'Semarang',
    phone: '024-555002',
    isActive: true
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    name: 'Solo Tengah',
    code: 'SOL',
    address: 'Jl. Slamet Riyadi No. 12, Solo',
    city: 'Solo',
    phone: '0271-555003',
    isActive: true
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    name: 'Purwokerto',
    code: 'PWK',
    address: 'Jl. Jend. Sudirman No. 8, Purwokerto',
    city: 'Purwokerto',
    phone: '0281-555004',
    isActive: true
  },
  {
    id: '11111111-0000-0000-0000-000000000005',
    name: 'Magelang',
    code: 'MGL',
    address: 'Jl. Ahmad Yani No. 3, Magelang',
    city: 'Magelang',
    phone: '0293-555005',
    isActive: true
  }
] as const
