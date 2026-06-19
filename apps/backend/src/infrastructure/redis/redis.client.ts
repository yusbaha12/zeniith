/*
Tujuan: Menyediakan factory client Redis dasar untuk queue, cache, dan realtime fase awal.
Caller: Container backend dan service/application yang memerlukan Redis.
Dependensi: ioredis, config service.
Main Functions: Membuat singleton client Redis dengan opsi lazy connect dan log error sederhana.
Side Effects: Membuka koneksi Redis saat digunakan dan menulis log saat koneksi gagal.
*/

import Redis from 'ioredis'

import type { AppConfig } from '../../application/services/config.service'

let redisClient: Redis | null = null

export const getRedisClient = (config: AppConfig): Redis => {
  if (redisClient) {
    return redisClient
  }

  redisClient = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 2
  })

  redisClient.on('error', (error) => {
    console.error('[redis.client]', error)
  })

  return redisClient
}
