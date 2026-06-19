/*
Tujuan: Menyediakan implementasi admin repository berbasis Drizzle untuk statistik dashboard, audit log, dan pengaturan fase 7.
Caller: Use case admin cabang dan super admin.
Dependensi: AppDatabase, schema terkait, dan Drizzle ORM.
Main Functions: Query agregat PostgreSQL untuk hitung avg score, murid aktif, simpan setting, dan fetch audit trail.
Side Effects: Membaca/menulis tabel users, subscriptions, branches, settings, dan permission_audits.
*/

import { and, avg, count, desc, eq, gt, sql } from 'drizzle-orm'

import type { BranchStats, IAdminRepository, NationalStats } from '../../domain/repositories/admin.repository'
import type { AppDatabase } from '../database/connection'
import { branches, examResults, packages, permissionAudits, settings, subscriptions, users } from '../database/schema'

export class AdminRepositoryImpl implements IAdminRepository {
  constructor(private readonly database: AppDatabase) {}

  async getBranchStats(branchId: string): Promise<BranchStats> {
    const now = new Date()

    // 1. Avg Score
    const [scoreRow] = await this.database
      .select({
        avgScore: avg(examResults.percentage)
      })
      .from(examResults)
      .innerJoin(users, eq(users.id, examResults.userId))
      .where(and(eq(users.branchId, branchId), eq(users.role, 'STUDENT')))

    // 2. Active Students (users with active subscriptions and not expired)
    const [studentRow] = await this.database
      .select({
        activeCount: count(users.id)
      })
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(users.branchId, branchId),
          eq(users.role, 'STUDENT'),
          eq(subscriptions.isActive, true),
          gt(subscriptions.endsAt, now)
        )
      )

    return {
      avgScore: scoreRow?.avgScore ? Number(Number(scoreRow.avgScore).toFixed(2)) : 0,
      activeStudents: studentRow?.activeCount ?? 0
    }
  }

  async getNationalStats(): Promise<NationalStats> {
    const now = new Date()

    // 1. National Avg Score
    const [scoreRow] = await this.database
      .select({
        avgScore: avg(examResults.percentage)
      })
      .from(examResults)
      .innerJoin(users, eq(users.id, examResults.userId))
      .where(eq(users.role, 'STUDENT'))

    // 2. National Active Students
    const [studentRow] = await this.database
      .select({
        activeCount: count(users.id)
      })
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(users.role, 'STUDENT'),
          eq(subscriptions.isActive, true),
          gt(subscriptions.endsAt, now)
        )
      )

    // 3. Total Branches
    const [branchRow] = await this.database
      .select({
        total: count(branches.id)
      })
      .from(branches)
      .where(eq(branches.isActive, true))

    // 4. Total Students Registered
    const [totalStudentRow] = await this.database
      .select({
        total: count(users.id)
      })
      .from(users)
      .where(eq(users.role, 'STUDENT'))

    return {
      avgScore: scoreRow?.avgScore ? Number(Number(scoreRow.avgScore).toFixed(2)) : 0,
      activeStudents: studentRow?.activeCount ?? 0,
      totalBranches: branchRow?.total ?? 0,
      totalStudents: totalStudentRow?.total ?? 0
    }
  }

  async getAuditLogs(limit: number): Promise<any[]> {
    return this.database
      .select({
        id: permissionAudits.id,
        actorUserId: permissionAudits.actorUserId,
        actorName: users.name,
        targetUserId: permissionAudits.targetUserId,
        targetRole: permissionAudits.targetRole,
        permissionCode: permissionAudits.permissionCode,
        effect: permissionAudits.effect,
        actionType: permissionAudits.actionType,
        metadata: permissionAudits.metadata,
        createdAt: permissionAudits.createdAt
      })
      .from(permissionAudits)
      .leftJoin(users, eq(users.id, permissionAudits.actorUserId))
      .orderBy(desc(permissionAudits.createdAt))
      .limit(limit)
  }

  async getSetting(key: string): Promise<Record<string, unknown> | null> {
    const [row] = await this.database
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1)

    return row ? (row.value as Record<string, unknown>) : null
  }

  async saveSetting(key: string, value: Record<string, unknown>): Promise<void> {
    await this.database
      .insert(settings)
      .values({
        key,
        value,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [settings.key],
        set: {
          value,
          updatedAt: new Date()
        }
      })
  }

  async getBranchReportData(branchId: string | null): Promise<any[]> {
    const query = this.database
      .select({
        studentId: users.id,
        studentName: users.name,
        studentEmail: users.email,
        studentPhone: users.phone,
        branchName: branches.name,
        packageName: packages.name,
        subscriptionStatus: sql<string>`CASE WHEN ${subscriptions.isActive} = true AND ${subscriptions.endsAt} > NOW() THEN 'Aktif' ELSE 'Tidak Aktif' END`,
        expiredAt: subscriptions.endsAt
      })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .leftJoin(packages, eq(subscriptions.packageId, packages.id))
      .where(
        and(
          eq(users.role, 'STUDENT'),
          branchId ? eq(users.branchId, branchId) : undefined
        )
      )
      .orderBy(users.name)

    return query
  }
}
