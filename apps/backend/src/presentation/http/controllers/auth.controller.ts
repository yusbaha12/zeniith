/*
Tujuan: Menyediakan endpoint auth fase 1 untuk login, register, refresh, dan logout.
Caller: Bootstrap app backend dan frontend auth flow.
Dependensi: Use case auth, config service, DTO auth, dan cookie Elysia.
Main Functions: Menangani request auth, mengatur cookie JWT, dan mengembalikan envelope response konsisten.
Side Effects: Menulis cookie httpOnly access/refresh token dan membaca/menulis tabel users melalui use case.
*/

import { Elysia } from 'elysia'

import { LoginDto, RegisterDto } from '../../../application/dto/auth.dto'
import type { AppConfig } from '../../../application/services/config.service'
import type { LoginUseCase } from '../../../application/use-cases/auth/login.usecase'
import type { RefreshTokenUseCase } from '../../../application/use-cases/auth/refresh-token.usecase'
import type { RegisterUseCase } from '../../../application/use-cases/auth/register.usecase'
import { UnauthorizedError } from '../../../shared/errors/app.error'

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30

const applyAuthCookies = (
  cookie: Record<string, any>,
  config: AppConfig,
  tokens: { accessToken: string; refreshToken?: string }
) => {
  cookie.accessToken?.set({
    value: tokens.accessToken,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: ACCESS_TOKEN_MAX_AGE
  })

  if (tokens.refreshToken) {
    cookie.refreshToken?.set({
      value: tokens.refreshToken,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: config.cookieSecure,
      maxAge: REFRESH_TOKEN_MAX_AGE
    })
  }
}

export const createAuthController = (
  config: AppConfig,
  loginUseCase: LoginUseCase,
  registerUseCase: RegisterUseCase,
  refreshTokenUseCase: RefreshTokenUseCase,
  loginRateLimiter?: any
) => {
  const loginOptions: any = { body: LoginDto }
  if (loginRateLimiter) {
    loginOptions.beforeHandle = loginRateLimiter
  }

  return new Elysia({ prefix: '/api/auth' })
    .post('/login', async ({ body, cookie }) => {
      const result = await loginUseCase.execute(body as any)

      applyAuthCookies(cookie, config, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      })

      return {
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user
        },
        message: 'Login berhasil'
      }
    }, loginOptions)
    .post('/register', async ({ body }) => ({
      success: true,
      data: await registerUseCase.execute(body),
      message: 'Pendaftaran berhasil, silakan login'
    }), {
      body: RegisterDto
    })
    .post('/refresh', async ({ cookie }) => {
      const refreshToken = cookie.refreshToken?.value as string | undefined

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token tidak ditemukan')
      }

      const result = await refreshTokenUseCase.execute(refreshToken)

      applyAuthCookies(cookie, config, {
        accessToken: result.accessToken
      })

      return {
        success: true,
        data: result,
        message: 'Token berhasil diperbarui'
      }
    })
    .post('/logout', ({ cookie }) => {
      cookie.accessToken?.remove()
      cookie.refreshToken?.remove()

      return {
        success: true,
        data: null,
        message: 'Logout berhasil'
      }
    })
}
