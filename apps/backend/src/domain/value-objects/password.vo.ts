/*
Tujuan: Memvalidasi aturan password minimum untuk login, register, dan ganti password.
Caller: Register use case dan update password use case.
Dependensi: AppError domain.
Main Functions: Menyediakan create() yang menolak password lemah dengan pesan validasi konsisten.
Side Effects: Tidak ada; value object murni.
*/

import { AppError } from '../../shared/errors/app.error'

export class PasswordVO {
  private constructor(public readonly value: string) {}

  static create(password: string): PasswordVO {
    if (password.trim().length < 8) {
      throw new AppError('Password minimal 8 karakter', 422, 'VALIDATION_ERROR', {
        password: ['Password minimal 8 karakter']
      })
    }

    return new PasswordVO(password)
  }
}
