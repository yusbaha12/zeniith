/*
Tujuan: Menormalisasi environment variable backend fase 0 menjadi konfigurasi typed yang mudah dipakai.
Caller: Container backend, bootstrap index.ts, Redis client, dan controller health.
Dependensi: process.env runtime Bun/Node dan loader `.env` workspace backend.
Main Functions: Memuat `.env` workspace bila perlu, membaca env, memberi fallback dev, dan memvalidasi parameter inti bootstrap serta payment/storage fase 2.
Side Effects: Mengisi `process.env` dari file `.env` lokal lalu melempar error saat konfigurasi wajib tidak tersedia atau tidak valid.
*/

import { loadWorkspaceEnv } from '../../shared/utils/load-env.util'

loadWorkspaceEnv()

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

export interface AppConfig {
  appName: string
  appUrl: string
  nodeEnv: string
  backendPort: number
  frontendUrl: string
  databaseUrl: string
  databaseReplicaUrl: string
  redisUrl: string
  jwtSecret: string
  jwtExpiresIn: string
  jwtRefreshExpiresIn: string
  cookieSecure: boolean
  s3Endpoint: string
  s3AccessKey: string
  s3SecretKey: string
  s3BucketName: string
  s3Region: string
  s3ForcePathStyle: boolean
  s3PresignedUrlTtl: number
  maxUploadSizeMb: number
  allowedPaymentProofTypes: string[]
  allowedMaterialAssetTypes: string[]
}

export const loadConfig = (): AppConfig => {
  const jwtSecret = process.env.JWT_SECRET ?? 'development-secret-please-change'

  return {
    appName: process.env.APP_NAME ?? 'LMS Bimbel',
    appUrl: process.env.APP_URL ?? 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    backendPort: toNumber(process.env.BACKEND_PORT, 3000),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL ?? 'postgresql://lms_user:lms_password@localhost:5432/lms_bimbel',
    databaseReplicaUrl: process.env.DATABASE_REPLICA_URL ?? process.env.DATABASE_URL ?? 'postgresql://lms_user:lms_password@localhost:5432/lms_bimbel',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    cookieSecure: (process.env.NODE_ENV ?? 'development') === 'production',
    s3Endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    s3AccessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
    s3SecretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
    s3BucketName: process.env.S3_BUCKET_NAME ?? 'lms-bimbel',
    s3Region: process.env.S3_REGION ?? 'us-east-1',
    s3ForcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    s3PresignedUrlTtl: toNumber(process.env.S3_PRESIGNED_URL_TTL, 3600),
    maxUploadSizeMb: toNumber(process.env.MAX_UPLOAD_SIZE_MB, 50),
    allowedPaymentProofTypes: (process.env.ALLOWED_PAYMENT_PROOF_TYPES ?? 'image/jpeg,image/png,image/webp,application/pdf')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    allowedMaterialAssetTypes: (process.env.ALLOWED_MATERIAL_ASSET_TYPES ?? 'image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }
}
