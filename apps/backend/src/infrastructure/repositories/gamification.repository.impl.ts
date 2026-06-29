/*
Tujuan: Menyediakan implementasi repository gamifikasi berbasis Drizzle.
Caller: GamificationService dan use case gamifikasi.
Dependensi: AppDatabase, schema gamification, users, dan Drizzle query helper.
Main Functions: Membaca/membuat aggregate profile, update karakter/progression, insert XP ledger idempotent, mengambil badge terbaru, dan quest aktif secara efisien.
Side Effects: Membaca/menulis tabel student_profiles, xp_ledger, badges, student_badges, quests, dan student_quests pada PostgreSQL.
*/

import { and, desc, eq, gte, lte } from 'drizzle-orm'

import {
  badges,
  quests,
  studentBadges,
  studentProfiles,
  studentQuests,
  type SelectStudentProfile,
  xpLedger
} from '../database/schema'
import type {
  GamificationCharacterCode,
  StudentBadgeSummary,
  StudentQuestSummary
} from '../../domain/entities/gamification.entity'
import { StudentProfileEntity } from '../../domain/entities/gamification.entity'
import type { IGamificationRepository } from '../../domain/repositories/gamification.repository'
import type { InsertXpLedgerInput, UpdateProgressionInput } from '../../domain/repositories/gamification.repository'
import type { AppDatabase } from '../database/connection'

const toProfileEntity = (row: SelectStudentProfile): StudentProfileEntity =>
  new StudentProfileEntity(
    row.userId,
    row.characterCode,
    row.level,
    row.totalXp,
    row.currentStreak,
    row.longestStreak,
    row.streakShields,
    row.lastActivityDate,
    row.updatedAt
  )

export class GamificationRepositoryImpl implements IGamificationRepository {
  constructor(private readonly database: AppDatabase) {}

  async findProfile(studentId: string, executor?: unknown): Promise<StudentProfileEntity | null> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, studentId))
      .limit(1)

    return row ? toProfileEntity(row) : null
  }

  async createProfile(
    studentId: string,
    characterCode: GamificationCharacterCode = 'ASTRA',
    executor?: unknown
  ): Promise<StudentProfileEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .insert(studentProfiles)
      .values({
        userId: studentId,
        characterCode
      })
      .onConflictDoUpdate({
        target: studentProfiles.userId,
        set: {
          updatedAt: new Date()
        }
      })
      .returning()

    return toProfileEntity(row)
  }

  async updateCharacter(
    studentId: string,
    characterCode: GamificationCharacterCode,
    executor?: unknown
  ): Promise<StudentProfileEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .update(studentProfiles)
      .set({
        characterCode,
        updatedAt: new Date()
      })
      .where(eq(studentProfiles.userId, studentId))
      .returning()

    return toProfileEntity(row)
  }

  async insertXpLedger(input: InsertXpLedgerInput, executor?: unknown): Promise<boolean> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const rows = await database
      .insert(xpLedger)
      .values({
        studentId: input.studentId,
        eventType: input.eventType,
        sourceId: input.sourceId,
        xpDelta: input.xpDelta,
        reason: input.reason,
        metadata: input.metadata ?? {}
      })
      .onConflictDoNothing({
        target: [xpLedger.studentId, xpLedger.eventType, xpLedger.sourceId]
      })
      .returning({ id: xpLedger.id })

    return rows.length > 0
  }

  async updateProgression(input: UpdateProgressionInput, executor?: unknown): Promise<StudentProfileEntity> {
    const database = (executor as AppDatabase | undefined) ?? this.database
    const [row] = await database
      .update(studentProfiles)
      .set({
        level: input.level,
        totalXp: input.totalXp,
        currentStreak: input.currentStreak,
        longestStreak: input.longestStreak,
        streakShields: input.streakShields,
        lastActivityDate: input.lastActivityDate,
        updatedAt: new Date()
      })
      .where(eq(studentProfiles.userId, input.studentId))
      .returning()

    return toProfileEntity(row)
  }

  async listRecentBadges(studentId: string, limit: number): Promise<StudentBadgeSummary[]> {
    const rows = await this.database
      .select({
        id: studentBadges.id,
        code: badges.code,
        name: badges.name,
        description: badges.description,
        category: badges.category,
        tier: badges.tier,
        earnedAt: studentBadges.earnedAt
      })
      .from(studentBadges)
      .innerJoin(badges, eq(studentBadges.badgeId, badges.id))
      .where(eq(studentBadges.studentId, studentId))
      .orderBy(desc(studentBadges.earnedAt))
      .limit(limit)

    return rows
  }

  async listActiveQuests(studentId: string, now: Date, limit: number): Promise<StudentQuestSummary[]> {
    const rows = await this.database
      .select({
        id: studentQuests.id,
        code: quests.code,
        type: quests.type,
        title: quests.title,
        description: quests.description,
        xpReward: quests.xpReward,
        progressValue: studentQuests.progressValue,
        targetValue: studentQuests.targetValue,
        status: studentQuests.status,
        startsAt: quests.startsAt,
        endsAt: quests.endsAt
      })
      .from(studentQuests)
      .innerJoin(quests, eq(studentQuests.questId, quests.id))
      .where(
        and(
          eq(studentQuests.studentId, studentId),
          eq(quests.isActive, true),
          lte(quests.startsAt, now),
          gte(quests.endsAt, now)
        )
      )
      .orderBy(desc(studentQuests.updatedAt))
      .limit(limit)

    return rows
  }
}
