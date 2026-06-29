/*
Tujuan: Menyediakan endpoint gamifikasi murid untuk snapshot profil dan pemilihan karakter.
Caller: Frontend `/student/dashboard` dan `/student/gamifikasi`.
Dependensi: Auth middleware, RBAC student, DTO gamifikasi, GetMyGamificationUseCase, dan ChooseCharacterUseCase.
Main Functions: Mengembalikan snapshot gamifikasi serta memperbarui karakter aktif murid.
Side Effects: Membaca dan menulis tabel student_profiles, membaca badge/quest, serta dapat membuat profil awal murid.
*/

import { Elysia } from 'elysia'

import { ChooseCharacterDto } from '../../../application/dto/gamification.dto'
import type { ChooseCharacterUseCase } from '../../../application/use-cases/gamification/choose-character.usecase'
import type { GetMyGamificationUseCase } from '../../../application/use-cases/gamification/get-my-gamification.usecase'
import { rbac } from '../middlewares/rbac.middleware'

export const createGamificationController = (
  authMiddleware: any,
  getMyGamificationUseCase: GetMyGamificationUseCase,
  chooseCharacterUseCase: ChooseCharacterUseCase
) =>
  new Elysia({ prefix: '/api/gamification' })
    .use(authMiddleware)
    .use(rbac('STUDENT'))
    .get('/me', async ({ user }: any) => ({
      success: true,
      data: await getMyGamificationUseCase.execute(user.id),
      message: 'Profil gamifikasi berhasil diambil'
    }))
    .patch('/me/character', async ({ body, user }: any) => ({
      success: true,
      data: await chooseCharacterUseCase.execute({
        studentId: user.id,
        characterCode: body.characterCode
      }),
      message: 'Karakter gamifikasi berhasil diperbarui'
    }), {
      body: ChooseCharacterDto
    })
