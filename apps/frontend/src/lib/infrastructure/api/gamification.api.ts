/*
Tujuan: Menyediakan module API frontend untuk profil gamifikasi dan pemilihan karakter murid.
Caller: Dashboard murid dan halaman `/student/gamifikasi`.
Dependensi: API client serta tipe gamifikasi frontend.
Main Functions: Mengambil snapshot gamifikasi dan mengirim perubahan karakter aktif.
Side Effects: Melakukan HTTP call ke backend `/api/gamification`.
*/

import type {
  FrontendGamificationSnapshot,
  GamificationCharacterCode
} from '$lib/domain/types/gamification.types'

import { apiClient } from './client'

export const gamificationApi = {
  getMine: () => apiClient.get<FrontendGamificationSnapshot>('/gamification/me'),
  chooseCharacter: (characterCode: GamificationCharacterCode) =>
    apiClient.patch<FrontendGamificationSnapshot>('/gamification/me/character', { characterCode })
}
