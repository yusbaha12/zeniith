/*
Tujuan: Menyediakan middleware RBAC fase 1 untuk membatasi akses route berdasarkan role.
Caller: Controller privat yang butuh pembatasan role.
Dependensi: Elysia, Role shared package, dan error Forbidden.
Main Functions: Memastikan context user ada dan rolenya termasuk yang diizinkan.
Side Effects: Tidak ada write; dapat memutus request dengan ForbiddenError.
*/

import { Elysia } from 'elysia'

import type { Role } from '@lms-bimbel/shared'

import { ForbiddenError } from '../../../shared/errors/app.error'

export const rbac = (...allowedRoles: Role[]) =>
  new Elysia({ name: 'rbac-middleware' }).derive(({ user }: any) => {
    if (!user || !allowedRoles.includes(user.role)) {
      throw new ForbiddenError(`Fitur ini hanya untuk: ${allowedRoles.join(', ')}`)
    }

    return {}
  })
