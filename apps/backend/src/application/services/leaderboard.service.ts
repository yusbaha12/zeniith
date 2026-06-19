/*
Tujuan: Menyediakan service fase 5 untuk snapshot leaderboard, cache Redis sorted set, dan publish event realtime.
Caller: Use case hasil ujian, controller leaderboard, queue grading, dan gateway WebSocket realtime.
Dependensi: Config backend, repository ujian, Redis client factory, dan logger.
Main Functions: Menyusun snapshot leaderboard dari DB, menyimpan score composite ke Redis, dan publish event update secara best-effort.
Side Effects: Membaca hasil ujian, menulis key Redis leaderboard, dan mem-publish event Redis Pub/Sub.
*/

import type { LeaderboardUpdatePayload } from '@lms-bimbel/shared'

import type { AppConfig } from './config.service'
import type { IExamRepository } from '../../domain/repositories/exam.repository'
import { getRedisClient } from '../../infrastructure/redis/redis.client'
import { logger } from '../../shared/utils/logger.util'

const LEADERBOARD_LIMIT = 10

const buildCompositeScore = (input: {
  percentage: number
  score: number
  durationSeconds: number
}): number => {
  const durationPenalty = Math.min(input.durationSeconds, 99_999)

  return (input.percentage * 1_000_000_000) + (input.score * 100_000) - durationPenalty
}

export class LeaderboardService {
  constructor(
    private readonly config: AppConfig,
    private readonly examRepository: IExamRepository
  ) {}

  async buildSnapshot(examId: string, currentSessionId: string | null = null): Promise<LeaderboardUpdatePayload> {
    const [entries, totalParticipants, currentSessionRank] = await Promise.all([
      this.examRepository.listLeaderboardEntries(examId, LEADERBOARD_LIMIT),
      this.examRepository.countLeaderboardParticipants(examId),
      currentSessionId ? this.examRepository.findLeaderboardRankBySessionId(currentSessionId) : Promise.resolve(null)
    ])

    return {
      examId,
      totalParticipants,
      currentSessionId,
      currentSessionRank,
      updatedAt: new Date().toISOString(),
      entries: entries.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        name: entry.name,
        branchName: entry.branchName,
        score: entry.score,
        percentage: entry.percentage,
        durationSeconds: entry.durationSeconds
      }))
    }
  }

  async buildSnapshotForUser(examId: string, userId: string): Promise<LeaderboardUpdatePayload> {
    const currentSessionId = await this.examRepository.findLatestResultSessionIdByExamAndUser(examId, userId)
    return this.buildSnapshot(examId, currentSessionId)
  }

  async recordResult(sessionId: string): Promise<void> {
    const entry = await this.examRepository.findLeaderboardEntryBySessionId(sessionId)

    if (!entry) {
      return
    }

    try {
      const redis = getRedisClient(this.config)
      await redis.connect().catch(() => undefined)

      const leaderboardKey = `leaderboard:exam:${entry.examId}`
      const payloadKey = `leaderboard:exam:${entry.examId}:session:${entry.sessionId}`
      const compositeScore = buildCompositeScore({
        percentage: entry.percentage,
        score: entry.score,
        durationSeconds: entry.durationSeconds
      })

      await redis.zadd(leaderboardKey, compositeScore, entry.sessionId)
      await redis.set(payloadKey, JSON.stringify(entry), 'EX', 60 * 60 * 24)
      await redis.publish('leaderboard:update', JSON.stringify({
        examId: entry.examId,
        sessionId: entry.sessionId
      }))
    } catch (error) {
      logger.warn('Leaderboard Redis fallback ke DB karena Redis belum tersedia', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      })
    }
  }
}
