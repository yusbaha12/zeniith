/*
Tujuan: Menjadi entry point backend fase 5 untuk ElysiaJS dengan health, auth, paket, ruang belajar, mesin ujian, dan realtime leaderboard.
Caller: Bun dev/build runtime, Docker backend container.
Dependensi: ElysiaJS, plugin cors/jwt/bearer/swagger, container dependency, AppError, dan queue scheduler/worker.
Main Functions: Bootstrap app, register plugin serta controller fase 1-5, tangani error global, lalu listen pada port backend.
Side Effects: Membuka port HTTP/WS, menginisialisasi plugin auth/docs/scheduler/worker, dan menulis log bootstrap ke stdout.
*/

import { bearer } from '@elysiajs/bearer'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'

import { createContainer } from './container'
import { AppError } from './shared/errors/app.error'

const container = createContainer()
const getErrorMeta = (error: unknown): { name: string; message: string } => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    }
  }

  return {
    name: 'UnknownError',
    message: 'Unknown error'
  }
}

const app = new Elysia()
  .onError({ as: 'global' }, ({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode

      container.logger.warn('Permintaan gagal terkontrol', {
        code: error.code,
        details: error.details
      })

      return {
        success: false,
        data: null,
        message: error.message,
        error: {
          code: error.code,
          details: error.details ?? null
        }
      }
    }

    if (code === 'VALIDATION') {
      set.status = 422

      return {
        success: false,
        data: null,
        message: 'Data tidak valid',
        error: {
          code: 'VALIDATION_ERROR',
          details: error
        }
      }
    }

    const errorMeta = getErrorMeta(error)

    container.logger.error('Unhandled backend error', {
      code,
      errorName: errorMeta.name,
      message: errorMeta.message
    })

    set.status = 500

    return {
      success: false,
      data: null,
      message: 'Terjadi kesalahan pada server',
      error: {
        code: 'INTERNAL_SERVER_ERROR'
      }
    }
  })
  .onRequest(({ set }) => {
    set.headers['X-Frame-Options'] = 'DENY'
    set.headers['X-Content-Type-Options'] = 'nosniff'
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    set.headers['X-Permitted-Cross-Domain-Policies'] = 'none'
    set.headers['X-XSS-Protection'] = '0'
    set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    set.headers['Content-Security-Policy'] =
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:;"
  })
  .use(
    cors({
      origin:
        container.config.nodeEnv === 'development'
          ? [container.config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']
          : container.config.frontendUrl,
      credentials: true
    })
  )
  .use(
    jwt({
      name: 'jwt',
      secret: container.config.jwtSecret,
      exp: container.config.jwtExpiresIn
    })
  )
  .use(bearer())
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: `${container.config.appName} API`,
          version: '0.1.0',
          description: 'Dokumentasi API fase 0 LMS Bimbel'
        }
      }
    })
  )
  .get('/', () => ({
    success: true,
    data: {
      name: container.config.appName,
      environment: container.config.nodeEnv
    },
    message: 'Backend LMS Bimbel fase 0 aktif'
  }))
  .use(container.healthController)
  .use(container.authController)
  .use(container.branchController)
  .use(container.userController)
  .use(container.packageController)
  .use(container.realtimeController)
  .use(container.examController)
  .use(container.materialController)
  .use(container.orderController)
  .use(container.adminOrderController)
  .use(container.teacherMaterialController)
  .use(container.teacherExamController)
  .use(container.proctorController)
  .use(container.branchAdminController)
  .use(container.superAdminController)

app.listen(container.config.backendPort)
void container.subscriptionExpiryScheduler.start()
void container.weeklyReportScheduler.start()
void container.examProcessingQueue.start()

container.logger.info('Backend fase 5 berjalan', {
  port: container.config.backendPort,
  docsPath: '/docs',
  healthPath: '/health',
  websocketPath: '/ws'
})
