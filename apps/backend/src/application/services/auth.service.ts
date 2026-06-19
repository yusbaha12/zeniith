/*
Tujuan: Menyediakan hashing password dan pengelolaan JWT access/refresh token fase 1.
Caller: Use case auth, middleware auth, dan controller auth.
Dependensi: jose, Bun.password, config service.
Main Functions: Hash/verify password bcrypt, sign/verify access token, sign/verify refresh token.
Side Effects: Menghasilkan token JWT dan memanfaatkan crypto runtime untuk hashing/verifikasi.
*/

import { SignJWT, jwtVerify } from 'jose'

import type { Role } from '@lms-bimbel/shared'

import type { AppConfig } from './config.service'

export interface AuthTokenPayload {
  sub: string
  role: Role
  branchId: string | null
  type: 'access' | 'refresh'
}

export class AuthService {
  private readonly secret: Uint8Array

  constructor(private readonly config: AppConfig) {
    this.secret = new TextEncoder().encode(config.jwtSecret)
  }

  async hashPassword(password: string): Promise<string> {
    return Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 12
    })
  }

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return Bun.password.verify(password, passwordHash)
  }

  async generateAccessToken(user: { id: string; role: Role; branchId: string | null }): Promise<string> {
    return new SignJWT({
      role: user.role,
      branchId: user.branchId,
      type: 'access'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(this.config.jwtExpiresIn)
      .sign(this.secret)
  }

  async generateRefreshToken(user: { id: string; role: Role; branchId: string | null }): Promise<string> {
    return new SignJWT({
      role: user.role,
      branchId: user.branchId,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(this.config.jwtRefreshExpiresIn)
      .sign(this.secret)
  }

  async verifyAccessToken(token: string): Promise<AuthTokenPayload> {
    const { payload } = await jwtVerify(token, this.secret)

    return {
      sub: payload.sub ?? '',
      role: payload.role as Role,
      branchId: (payload.branchId as string | null | undefined) ?? null,
      type: payload.type as 'access'
    }
  }

  async verifyRefreshToken(token: string): Promise<AuthTokenPayload> {
    const { payload } = await jwtVerify(token, this.secret)

    return {
      sub: payload.sub ?? '',
      role: payload.role as Role,
      branchId: (payload.branchId as string | null | undefined) ?? null,
      type: payload.type as 'refresh'
    }
  }
}
