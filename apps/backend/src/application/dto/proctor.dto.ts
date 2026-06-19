/*
Tujuan: Mendefinisikan DTO dan skema validasi Elysia untuk modul proctoring fase 6.
Caller: Proctor controller (HTTP).
Dependensi: Elysia TypeBox.
Main Functions: Menyediakan skema parameter dan request body untuk live proctoring.
Side Effects: Tidak ada; skema validasi murni.
*/

import { t } from 'elysia'

export const ProctorExamParamsDto = t.Object({
  id: t.String({ format: 'uuid', error: 'ID Ujian harus berupa UUID v4' })
})

export const ProctorSessionParamsDto = t.Object({
  id: t.String({ format: 'uuid', error: 'ID Sesi harus berupa UUID v4' })
})

export const WarnStudentBodyDto = t.Object({
  userId: t.String({ format: 'uuid', error: 'ID User harus berupa UUID v4' }),
  message: t.String({ minLength: 1, error: 'Pesan peringatan tidak boleh kosong' })
})
