/*
Tujuan: Menyediakan endpoint health check fase 0 untuk verifikasi bootstrap backend.
Caller: index.ts melalui `.use(healthController)`, Docker healthcheck, dan smoke test developer.
Dependensi: ElysiaJS, config service.
Main Functions: Mengembalikan status backend beserta metadata runtime sederhana.
Side Effects: Tidak ada write; hanya membaca konfigurasi runtime lalu membalas JSON.
*/

import type { AppConfig } from '../../../application/services/config.service'

import { Elysia } from 'elysia'

export const createHealthController = (config: AppConfig) =>
  new Elysia({ prefix: '' }).get('/health', () => ({
    status: 'ok',
    app: config.appName,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  }))
