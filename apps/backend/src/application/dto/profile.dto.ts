/*
Tujuan: Mendefinisikan schema validasi request profile fase 1.
Caller: User controller.
Dependensi: Elysia `t`.
Main Functions: Menyediakan body schema update profil dan ganti password.
Side Effects: Tidak ada; hanya validasi runtime request.
*/

import { t } from 'elysia'

export const UpdateProfileDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  phone: t.String({ minLength: 10, maxLength: 15 })
})

export const UpdatePasswordDto = t.Object({
  currentPassword: t.String({ minLength: 8 }),
  newPassword: t.String({ minLength: 8 })
})
