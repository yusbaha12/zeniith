/*
Tujuan: Menyediakan endpoint profil sendiri fase 1 untuk baca profil, ubah profil, dan ganti password dengan guard permission granular.
Caller: Bootstrap backend dan frontend halaman profil.
Dependensi: Auth middleware, permission guard, DTO profile, dan use case profile.
Main Functions: Mengamankan route `/api/me*` dengan auth dan permission lalu mendelegasikan logika ke use case.
Side Effects: Membaca dan menulis tabel users melalui use case terkait.
*/

import { Elysia } from 'elysia'

import { UpdatePasswordDto, UpdateProfileDto } from '../../../application/dto/profile.dto'
import type { GetProfileUseCase } from '../../../application/use-cases/user/get-profile.usecase'
import type { UpdatePasswordUseCase } from '../../../application/use-cases/user/update-password.usecase'
import type { UpdateProfileUseCase } from '../../../application/use-cases/user/update-profile.usecase'
import { withPermissions } from '../middlewares/permission.middleware'

export const createUserController = (
  authMiddleware: any,
  getProfileUseCase: GetProfileUseCase,
  updateProfileUseCase: UpdateProfileUseCase,
  updatePasswordUseCase: UpdatePasswordUseCase
) =>
  new Elysia({ prefix: '/api' })
    .use(authMiddleware)
    .get('/me', withPermissions(['profile.self.view'], async ({ user, authz }: any) => ({
      success: true,
      data: {
        ...user,
        permissions: authz?.permissions ?? []
      },
      message: 'Profil berhasil diambil'
    })))
    .patch('/me', withPermissions(['profile.self.update'], async ({ body, user }: any) => ({
      success: true,
      data: await updateProfileUseCase.execute({
        userId: user.id,
        name: body.name,
        phone: body.phone
      }),
      message: 'Profil berhasil diperbarui'
    })), {
      body: UpdateProfileDto
    })
    .patch('/me/password', withPermissions(['profile.self.update'], async ({ body, user }: any) => ({
      success: true,
      data: await updatePasswordUseCase.execute({
        userId: user.id,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword
      }),
      message: 'Password berhasil diperbarui'
    })), {
      body: UpdatePasswordDto
    })
