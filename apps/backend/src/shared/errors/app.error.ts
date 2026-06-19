/*
Tujuan: Menyediakan kelas error aplikasi dasar agar global error handler konsisten sejak fase 0.
Caller: Use case, service, repository, dan bootstrap error handler backend.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menyimpan status code, error code, dan detail error aplikasi.
Side Effects: Tidak ada; hanya membungkus informasi error.
*/

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly code: string = 'APP_ERROR',
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Tidak memiliki akses') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Akses ditolak') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} tidak ditemukan`, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Data yang sama sudah ada') {
    super(message, 409, 'CONFLICT')
  }
}
