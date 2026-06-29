/*
Tujuan: Mendefinisikan schema validasi request gamifikasi.
Caller: Gamification controller.
Dependensi: Elysia `t`.
Main Functions: Menyediakan body schema pilih karakter murid.
Side Effects: Tidak ada; hanya validasi runtime request.
*/

import { t } from 'elysia'

export const ChooseCharacterDto = t.Object({
  characterCode: t.Union([
    t.Literal('ASTRA'),
    t.Literal('NOVA'),
    t.Literal('LUMI'),
    t.Literal('RAKA')
  ])
})
