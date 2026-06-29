/*
Tujuan: Mengambil snapshot gamifikasi murid yang sedang login.
Caller: Gamification controller endpoint `GET /api/gamification/me`.
Dependensi: GamificationService.
Main Functions: Mengembalikan karakter, level, XP, streak, badge terbaru, dan quest aktif.
Side Effects: Dapat membuat row student_profiles awal jika murid belum memiliki profil gamifikasi.
*/

import type { GamificationService } from '../../services/gamification.service'

export class GetMyGamificationUseCase {
  constructor(private readonly gamificationService: GamificationService) {}

  async execute(studentId: string) {
    return this.gamificationService.getStudentSnapshot(studentId)
  }
}
