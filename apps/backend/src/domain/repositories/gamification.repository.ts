/*
Tujuan: Mendefinisikan kontrak repository gamifikasi untuk profil, karakter, XP ledger, badge, dan quest murid.
Caller: GamificationService dan use case gamifikasi.
Dependensi: Entitas domain gamifikasi.
Main Functions: Menyediakan operasi aggregate profile, update karakter, insert XP idempotent, update progression, badge terbaru, dan quest aktif.
Side Effects: Tidak ada; file kontrak interface.
*/

import type {
  GamificationEventType,
  GamificationCharacterCode,
  StudentBadgeSummary,
  StudentProfileEntity,
  StudentQuestSummary
} from '../entities/gamification.entity'

export interface InsertXpLedgerInput {
  studentId: string
  eventType: GamificationEventType
  sourceId: string
  xpDelta: number
  reason: string
  metadata?: Record<string, unknown>
}

export interface UpdateProgressionInput {
  studentId: string
  level: number
  totalXp: number
  currentStreak: number
  longestStreak: number
  streakShields: number
  lastActivityDate: string
}

export interface IGamificationRepository {
  findProfile(studentId: string, executor?: unknown): Promise<StudentProfileEntity | null>
  createProfile(studentId: string, characterCode?: GamificationCharacterCode, executor?: unknown): Promise<StudentProfileEntity>
  updateCharacter(studentId: string, characterCode: GamificationCharacterCode, executor?: unknown): Promise<StudentProfileEntity>
  insertXpLedger(input: InsertXpLedgerInput, executor?: unknown): Promise<boolean>
  updateProgression(input: UpdateProgressionInput, executor?: unknown): Promise<StudentProfileEntity>
  listRecentBadges(studentId: string, limit: number): Promise<StudentBadgeSummary[]>
  listActiveQuests(studentId: string, now: Date, limit: number): Promise<StudentQuestSummary[]>
}
