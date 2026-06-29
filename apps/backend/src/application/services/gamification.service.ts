/*
Tujuan: Menyediakan kalkulasi, snapshot, dan reward event awal gamifikasi murid berbasis aggregate profile.
Caller: GetMyGamificationUseCase, ChooseCharacterUseCase, TrackMaterialProgressUseCase, dan reward event pipeline berikutnya.
Dependensi: IGamificationRepository dan entitas gamifikasi.
Main Functions: Menghitung XP level berikutnya, daftar karakter, snapshot profil, dan reward materi selesai idempotent.
Side Effects: Membaca/menulis repository gamifikasi dan dapat membuat profile awal murid jika belum ada.
*/

import {
  CHARACTER_DEFINITIONS,
  type GamificationCharacterCode
} from '../../domain/entities/gamification.entity'
import type { IGamificationRepository } from '../../domain/repositories/gamification.repository'

export class GamificationService {
  constructor(private readonly gamificationRepository: IGamificationRepository) {}

  listCharacters() {
    return CHARACTER_DEFINITIONS
  }

  getNextLevelXp(level: number): number {
    return 100 + Math.max(0, level - 1) * 35
  }

  getLevelProgress(totalXp: number, level: number) {
    let remainingXp = totalXp
    let accumulatedBeforeLevel = 0

    for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
      const required = this.getNextLevelXp(currentLevel)
      remainingXp = Math.max(0, remainingXp - required)
      accumulatedBeforeLevel += required
    }

    const nextLevelXp = this.getNextLevelXp(level)
    const currentLevelXp = Math.max(0, totalXp - accumulatedBeforeLevel)
    const progressPercent = nextLevelXp > 0 ? Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100)) : 0

    return {
      currentLevelXp,
      nextLevelXp,
      progressPercent
    }
  }

  calculateLevel(totalXp: number): number {
    let level = 1
    let remainingXp = totalXp

    while (remainingXp >= this.getNextLevelXp(level)) {
      remainingXp -= this.getNextLevelXp(level)
      level += 1
    }

    return level
  }

  private getTodayKey(now: Date): string {
    return now.toISOString().slice(0, 10)
  }

  private getYesterdayKey(now: Date): string {
    const yesterday = new Date(now)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    return yesterday.toISOString().slice(0, 10)
  }

  async awardMaterialCompleted(studentId: string, materialId: string, executor?: unknown) {
    const profile =
      (await this.gamificationRepository.findProfile(studentId, executor)) ??
      (await this.gamificationRepository.createProfile(studentId, 'ASTRA', executor))
    const xpDelta = 25
    const wasInserted = await this.gamificationRepository.insertXpLedger({
      studentId,
      eventType: 'MATERIAL_COMPLETED',
      sourceId: materialId,
      xpDelta,
      reason: 'Materi selesai pertama kali',
      metadata: { materialId }
    }, executor)

    if (!wasInserted) {
      return {
        applied: false,
        profile
      }
    }

    const now = new Date()
    const todayKey = this.getTodayKey(now)
    const yesterdayKey = this.getYesterdayKey(now)
    const currentStreak =
      profile.lastActivityDate === todayKey
        ? profile.currentStreak
        : profile.lastActivityDate === yesterdayKey
          ? profile.currentStreak + 1
          : 1
    const totalXp = profile.totalXp + xpDelta
    const level = this.calculateLevel(totalXp)
    const updatedProfile = await this.gamificationRepository.updateProgression({
      studentId,
      level,
      totalXp,
      currentStreak,
      longestStreak: Math.max(profile.longestStreak, currentStreak),
      streakShields: profile.streakShields,
      lastActivityDate: todayKey
    }, executor)

    return {
      applied: true,
      xpDelta,
      profile: updatedProfile
    }
  }

  async getStudentSnapshot(studentId: string) {
    const profile =
      (await this.gamificationRepository.findProfile(studentId)) ??
      (await this.gamificationRepository.createProfile(studentId))
    const levelProgress = this.getLevelProgress(profile.totalXp, profile.level)
    const [recentBadges, activeQuests] = await Promise.all([
      this.gamificationRepository.listRecentBadges(studentId, 5),
      this.gamificationRepository.listActiveQuests(studentId, new Date(), 6)
    ])

    return {
      profile: {
        userId: profile.userId,
        characterCode: profile.characterCode,
        character: profile.getCharacter(),
        level: profile.level,
        totalXp: profile.totalXp,
        currentLevelXp: levelProgress.currentLevelXp,
        nextLevelXp: levelProgress.nextLevelXp,
        progressPercent: levelProgress.progressPercent,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        streakShields: profile.streakShields,
        lastActivityDate: profile.lastActivityDate
      },
      characters: this.listCharacters(),
      recentBadges,
      activeQuests
    }
  }

  isValidCharacter(characterCode: string): characterCode is GamificationCharacterCode {
    return CHARACTER_DEFINITIONS.some((character) => character.code === characterCode)
  }
}
