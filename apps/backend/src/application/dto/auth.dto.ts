/*
Tujuan: Mendefinisikan schema validasi request auth fase 1.
Caller: Auth controller.
Dependensi: Elysia `t`.
Main Functions: Menyediakan body schema login dan register.
Side Effects: Tidak ada; hanya validasi runtime request.
*/

import { t } from 'elysia'

export const LoginDto = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 })
})

export const RegisterDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
  phone: t.String({ minLength: 10, maxLength: 15 }),
  branchId: t.String({ format: 'uuid' })
})
