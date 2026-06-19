/*
Tujuan: Menyediakan middleware rate limiter berbasis Redis untuk membatasi request per IP.
Caller: Route controller (seperti /api/auth/login) yang butuh pencegahan brute force.
Dependensi: Redis client (ioredis).
Main Functions: Menyimpan hit count di Redis per IP-route key dan mengembalikan status 429 saat batas terlampaui.
Side Effects: Membaca dan menulis data key pada Redis dengan TTL.
*/

import type Redis from 'ioredis'

export interface RateLimiterOptions {
  max: number
  durationSeconds: number
}

export const rateLimit = (
  redis: Redis,
  options: RateLimiterOptions = { max: 10, durationSeconds: 60 }
) => {
  return async ({ request, set, error }: any) => {
    // 1. Dapatkan IP address klien
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    // 2. Buat unique key per IP + method + path
    const url = new URL(request.url)
    const key = `ratelimit:${ip}:${request.method}:${url.pathname}`

    try {
      // 3. Increment hit count di Redis
      const hits = await redis.incr(key)

      // 4. Jika baru pertama kali hit, set expiration time
      if (hits === 1) {
        await redis.expire(key, options.durationSeconds)
      }

      // 5. Set headers rate limit standar
      const remaining = Math.max(0, options.max - hits)
      set.headers['x-ratelimit-limit'] = String(options.max)
      set.headers['x-ratelimit-remaining'] = String(remaining)

      // 6. Cek jika limit terlampaui
      if (hits > options.max) {
        set.headers['retry-after'] = String(options.durationSeconds)
        return error(429, {
          success: false,
          data: null,
          message: 'Batas percobaan login terlampaui. Silakan coba lagi beberapa saat lagi.',
          error: {
            code: 'TOO_MANY_REQUESTS'
          }
        })
      }
    } catch (err) {
      // Jika terjadi gangguan Redis, log error saja agar request tetap berlanjut
      console.error('[RateLimitMiddleware] Redis error:', err)
    }
  }
}
