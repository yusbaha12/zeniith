/*
Tujuan: Menyediakan scheduler BullMQ fase 7 untuk men-generate laporan mingguan secara otomatis.
Caller: Container backend dan bootstrap index saat server mulai berjalan.
Dependensi: BullMQ, Redis client, admin repository, logger, dan config backend.
Main Functions: Mendaftarkan cron job mingguan dan menghasilkan rangkuman laporan cabang nasional.
Side Effects: Membuka koneksi Redis, membuat repeat job BullMQ, dan memproses agregasi data.
*/

import { Queue, Worker } from 'bullmq'

import type { AppConfig } from '../../application/services/config.service'
import type { IAdminRepository } from '../../domain/repositories/admin.repository'
import { logger } from '../../shared/utils/logger.util'

export class WeeklyReportScheduler {
  private worker: Worker | null = null
  private queue: Queue | null = null
  private started = false

  constructor(
    private readonly config: AppConfig,
    private readonly adminRepository: IAdminRepository
  ) {}

  async start(): Promise<void> {
    if (this.started) {
      return
    }

    try {
      const redisUrl = new URL(this.config.redisUrl)
      const connection = {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || '6379'),
        username: redisUrl.username || undefined,
        password: redisUrl.password || undefined,
        maxRetriesPerRequest: null
      }

      this.queue = new Queue('weekly-report', {
        connection
      })

      this.worker = new Worker(
        'weekly-report',
        async () => {
          logger.info('Menjalankan cronjob mingguan: weekly-report generation')
          const stats = await this.adminRepository.getNationalStats()

          logger.info('Laporan Mingguan Nasional berhasil digenerate:', {
            timestamp: new Date().toISOString(),
            totalBranches: stats.totalBranches,
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            avgScore: stats.avgScore
          })

          // Simpan ringkasan laporan ke table settings
          await this.adminRepository.saveSetting('last_weekly_report', {
            generatedAt: new Date().toISOString(),
            stats
          })
        },
        {
          connection
        }
      )

      // Jalankan setiap hari Minggu pukul 00:00 (cron pattern)
      await this.queue.add(
        'generate-weekly-report',
        {},
        {
          repeat: {
            pattern: '0 0 * * 0'
          },
          jobId: 'generate-weekly-report'
        }
      )

      this.started = true
      logger.info('Scheduler weekly-report berhasil dimulai')
    } catch (error) {
      logger.warn('Scheduler weekly-report gagal dimulai karena Redis/koneksi bermasalah', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
