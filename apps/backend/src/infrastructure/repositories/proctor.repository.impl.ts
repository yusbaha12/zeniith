/*
Tujuan: Menyediakan implementasi proctor repository berbasis Drizzle untuk proctoring live dan audit log fase 6.
Caller: Use case proctoring, WebSocket handler, dan monitor guru.
Dependensi: AppDatabase, schema proctorLogs/proctorWarnings/examSessions/users/branches, dan entitas proctor.
Main Functions: Menyimpan log kecurangan, menyimpan peringatan, menaikkan warning count sesi, dan mengambil data monitor live guru.
Side Effects: Membaca dan menulis database PostgreSQL.
*/

import { and, eq, sql } from 'drizzle-orm'

import { ProctorLogEntity, ProctorWarningEntity } from '../../domain/entities/proctor.entity'
import type { IProctorRepository, LiveProctorParticipant } from '../../domain/repositories/proctor.repository'
import type { AppDatabase } from '../database/connection'
import { branches, examSessions, proctorLogs, proctorWarnings, users } from '../database/schema'

export class ProctorRepositoryImpl implements IProctorRepository {
  constructor(private readonly database: AppDatabase) {}

  async saveLog(log: Omit<ProctorLogEntity, 'id' | 'occurredAt'>): Promise<ProctorLogEntity> {
    const [row] = await this.database
      .insert(proctorLogs)
      .values({
        sessionId: log.sessionId,
        userId: log.userId,
        eventType: log.eventType,
        metadata: log.metadata
      })
      .returning()

    return new ProctorLogEntity(
      row.id,
      row.sessionId,
      row.userId,
      row.eventType,
      row.metadata as Record<string, unknown>,
      row.occurredAt
    )
  }

  async saveWarning(warning: Omit<ProctorWarningEntity, 'id' | 'createdAt'>): Promise<ProctorWarningEntity> {
    const [row] = await this.database
      .insert(proctorWarnings)
      .values({
        sessionId: warning.sessionId,
        userId: warning.userId,
        warningCount: warning.warningCount,
        message: warning.message
      })
      .returning()

    return new ProctorWarningEntity(
      row.id,
      row.sessionId,
      row.userId,
      row.warningCount,
      row.message,
      row.createdAt
    )
  }

  async incrementSessionWarningCount(sessionId: string): Promise<number> {
    const [row] = await this.database
      .update(examSessions)
      .set({
        warningCount: sql`${examSessions.warningCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(examSessions.id, sessionId))
      .returning()

    return row?.warningCount ?? 0
  }

  async getLogsBySessionId(sessionId: string): Promise<ProctorLogEntity[]> {
    const rows = await this.database
      .select()
      .from(proctorLogs)
      .where(eq(proctorLogs.sessionId, sessionId))
      .orderBy(proctorLogs.occurredAt)

    return rows.map(
      (row) =>
        new ProctorLogEntity(
          row.id,
          row.sessionId,
          row.userId,
          row.eventType,
          row.metadata as Record<string, unknown>,
          row.occurredAt
        )
    )
  }

  async getLiveProctorData(examId: string): Promise<LiveProctorParticipant[]> {
    const rows = await this.database
      .select({
        sessionId: examSessions.id,
        userId: examSessions.userId,
        name: users.name,
        branchName: branches.name,
        status: examSessions.status,
        warningCount: examSessions.warningCount,
        lastHeartbeatAt: examSessions.lastHeartbeatAt,
        startedAt: examSessions.startedAt,
        submittedAt: examSessions.submittedAt
      })
      .from(examSessions)
      .innerJoin(users, eq(users.id, examSessions.userId))
      .leftJoin(branches, eq(branches.id, users.branchId))
      .where(eq(examSessions.examId, examId))
      .orderBy(users.name)

    return rows.map((row) => ({
      sessionId: row.sessionId,
      userId: row.userId,
      name: row.name,
      branchName: row.branchName,
      status: row.status,
      warningCount: row.warningCount,
      lastHeartbeatAt: row.lastHeartbeatAt,
      startedAt: row.startedAt,
      submittedAt: row.submittedAt
    }))
  }
}
