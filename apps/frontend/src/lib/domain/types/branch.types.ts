/*
Tujuan: Menyediakan kontrak tipe branch frontend untuk form pendaftaran.
Caller: Branch API dan halaman daftar.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menstandarkan bentuk daftar cabang aktif dari backend.
Side Effects: Tidak ada; file type murni.
*/

export interface FrontendBranch {
  id: string
  name: string
  code: string
  city: string | null
}
