/*
Tujuan: Menyediakan middleware autentikasi backend yang menerima bearer token atau cookie access token sekaligus memuat authz efektif user.
Caller: User controller dan controller privat lain pada fase berikutnya.
Dependensi: AuthService, IUserRepository, dan AuthorizationService.
Main Functions: Memverifikasi token, memuat user aktif, menyelesaikan permission efektif, lalu menyuntikkan context `user` dan `authz` ke route parent secara scoped.
Side Effects: Membaca tabel users, tabel RBAC melalui service authz, serta dapat membaca Redis cache authz dan melempar UnauthorizedError.
*/

import { Elysia } from 'elysia'

import type { IUserRepository } from '../../../domain/repositories/user.repository'
import { UnauthorizedError } from '../../../shared/errors/app.error'
import type { AuthService } from '../../../application/services/auth.service'
import type { AuthorizationService } from '../../../application/services/authorization.service'

export const createAuthMiddleware = (
  authService: AuthService,
  userRepository: IUserRepository,
  authorizationService: AuthorizationService
) =>
  new Elysia({ name: 'auth-middleware' })
    .derive(async ({ headers, cookie }) => {
      const authorization = headers.authorization
      const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
      const token = bearer ?? (cookie.accessToken?.value as string | undefined)

      if (!token) {
        throw new UnauthorizedError('Silakan login terlebih dahulu')
      }

      const payload = await authService.verifyAccessToken(token)

      if (payload.type !== 'access' || !payload.sub) {
        throw new UnauthorizedError('Token akses tidak valid')
      }

      const user = await userRepository.findById(payload.sub)

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Sesi tidak valid atau akun tidak aktif')
      }

      const authz = await authorizationService.resolveForUser({
        id: user.id,
        role: user.role
      })

      return {
        user: user.toSafeProfile(),
        authz
      }
    })
    .as('scoped')
