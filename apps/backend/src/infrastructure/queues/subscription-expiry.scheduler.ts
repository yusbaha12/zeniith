/*
Tujuan: Menyediakan scheduler BullMQ fase 2 untuk menandai subscription yang sudah habis masa aktifnya.
Caller: Container backend dan bootstrap index saat server mulai berjalan.
Dependensi: BullMQ, Redis client, subscription repository, logger, dan config backend.
Main Functions: Mendaftarkan repeat job expire subscription dan memproses batch update secara aman.
Side Effects: Membuka koneksi Redis, membuat repeat job BullMQ, dan menulis update ke tabel subscriptions.
*/

import { Queue, Worker } from 'bullmq'

import type { AppConfig } from '../../application/services/config.service'
import type { ISubscriptionRepository } from '../../domain/repositories/subscription.repository'
import { logger } from '../../shared/utils/logger.util'

export class SubscriptionExpiryScheduler {
  private worker: Worker | null = null
  private queue: Queue | null = null
  private started = false

  constructor(
    private readonly config: AppConfig,
    private readonly subscriptionRepository: ISubscriptionRepository
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

      this.queue = new Queue('subscription-expiry', {
        connection
      })

      this.worker = new Worker(
        'subscription-expiry',
        async () => {
          const expiredCount = await this.subscriptionRepository.expireDueSubscriptions(new Date())

          if (expiredCount > 0) {
            logger.info('Scheduler subscription-expiry menonaktifkan langganan kadaluarsa', {
              expiredCount
            })
          }
        },
        {
          connection
        }
      )

      await this.queue.add('expire-due-subscriptions', {}, {
        repeat: {
          every: 60_000
        },
        jobId: 'expire-due-subscriptions'
      })

      this.started = true
    } catch (error) {
      logger.warn('Scheduler subscription-expiry tidak aktif karena Redis belum tersedia', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
