/*
Tujuan: Memvalidasi dan menormalisasi email user di fase auth.
Caller: Register use case dan login use case.
Dependensi: AppError domain.
Main Functions: Menyediakan create() yang mengembalikan email valid atau melempar AppError.
Side Effects: Tidak ada; value object murni.
*/

import { AppError } from '../../shared/errors/app.error'

export class EmailVO {
  private constructor(public readonly value: string) {}

  static create(email: string): EmailVO {
    const normalized = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new AppError('Format email tidak valid', 422, 'VALIDATION_ERROR', {
        email: ['Format email tidak valid']
      })
    }

    return new EmailVO(normalized)
  }
}
