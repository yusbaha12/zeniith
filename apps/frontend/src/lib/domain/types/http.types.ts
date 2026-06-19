/*
Tujuan: Menyediakan kontrak response HTTP generik untuk API client frontend fase 0.
Caller: API client dan route/component frontend yang mengonsumsi backend.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menyatukan bentuk response sukses/gagal dari backend.
Side Effects: Tidak ada; file type murni.
*/

export interface ApiErrorShape {
  code: string
  details?: unknown
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  error?: ApiErrorShape
}
