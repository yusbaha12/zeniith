/*
Tujuan: Menyediakan middleware subscription guard fase 2 untuk membatasi akses materi berlangganan.
Caller: Route privat yang membutuhkan langganan aktif mulai fase 2 dan fase 3.
Dependensi: Elysia, use case active subscription, dan error Forbidden.
Main Functions: Memastikan murid memiliki langganan aktif lalu menyuntikkan context `activeSubscription`.
Side Effects: Membaca tabel subscriptions melalui use case dan dapat memutus request dengan ForbiddenError.
*/

import { Elysia } from 'elysia'

import type { GetActiveSubscriptionUseCase } from '../../../application/use-cases/subscription/get-active-subscription.usecase'
import { ForbiddenError } from '../../../shared/errors/app.error'

export const createSubscriptionMiddleware = (
  getActiveSubscriptionUseCase: GetActiveSubscriptionUseCase
) =>
  new Elysia({ name: 'subscription-middleware' })
    .resolve(async ({ user }: any) => {
      if (!user?.id) {
        throw new ForbiddenError('Sesi user tidak ditemukan')
      }

      const activeSubscription = await getActiveSubscriptionUseCase.execute(user.id)

      if (!activeSubscription) {
        throw new ForbiddenError('Langganan paket Anda belum aktif')
      }

      return {
        activeSubscription
      }
    })
    .as('scoped')
