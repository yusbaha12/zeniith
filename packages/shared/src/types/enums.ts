/*
Tujuan: Mendefinisikan enum string bersama untuk status domain lintas backend dan frontend.
Caller: Use case backend, UI frontend, API client, dan WebSocket payload.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menyediakan union type untuk order, payment, package, materi, exam, dan session.
Side Effects: Tidak ada; file kontrak type murni.
*/

export type OrderStatus = 'PENDING' | 'PAID' | 'REJECTED' | 'EXPIRED' | 'REFUNDED'
export type PaymentMethod = 'BANK_TRANSFER' | 'QRIS' | 'VIRTUAL_ACCOUNT'
export type PackageType = 'REGULER' | 'INTENSIF' | 'PREMIUM'
export type MaterialType = 'VIDEO' | 'PDF' | 'EXERCISE' | 'TEXT'
export type ExamType = 'TRYOUT' | 'LATIHAN' | 'MID_EXAM' | 'FINAL_EXAM'
export type SessionStatus = 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'TERMINATED'
export type QuestionType = 'MULTIPLE_CHOICE' | 'ESSAY'
