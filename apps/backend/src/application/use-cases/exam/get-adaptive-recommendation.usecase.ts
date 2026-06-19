import type { IExamRepository } from '../../../domain/repositories/exam.repository'

export interface RecommendedTopic {
  title: string
  difficulty: 'Mudah' | 'Sedang' | 'Sulit'
  estimatedDurationMinutes: number
  icon: string
}

export interface AdaptiveRecommendation {
  level: 'PENGUATAN_DASAR' | 'PEMANTAPAN_KONSISTENSI' | 'TANTANGAN_HOTS' | 'AWAL_BELAJAR'
  lastExamTitle: string | null
  lastPercentage: number | null
  message: string
  actionLabel: string
  actionUrl: string
  recommendedTopics: RecommendedTopic[]
}

export class GetAdaptiveRecommendationUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(userId: string): Promise<AdaptiveRecommendation> {
    const latestResult = await this.examRepository.findLatestResultByUser(userId)

    if (!latestResult) {
      return {
        level: 'AWAL_BELAJAR',
        lastExamTitle: null,
        lastPercentage: null,
        message: 'Mari mulai petualangan belajarmu! Kerjakan Try Out pertamamu untuk mendapatkan analisis dan rekomendasi belajar adaptif.',
        actionLabel: 'Mulai Try Out',
        actionUrl: '/student/tryout',
        recommendedTopics: [
          { title: 'Matematika Dasar & Logika', difficulty: 'Sedang', estimatedDurationMinutes: 45, icon: '📐' },
          { title: 'Pemahaman Bacaan Bahasa Indonesia', difficulty: 'Sedang', estimatedDurationMinutes: 30, icon: '📖' },
          { title: 'Pengetahuan Kuantitatif Awal', difficulty: 'Sedang', estimatedDurationMinutes: 40, icon: '🧮' }
        ]
      }
    }

    const lastExam = await this.examRepository.findById(latestResult.examId)
    const lastExamTitle = lastExam?.title ?? 'Try Out Sebelumnya'
    const lastPercentage = latestResult.percentage

    if (lastPercentage < 60) {
      return {
        level: 'PENGUATAN_DASAR',
        lastExamTitle,
        lastPercentage,
        message: `Berdasarkan hasil Try Out terakhirmu (${lastPercentage}%), mari perkuat konsep-konsep dasar terlebih dahulu untuk membangun fondasi pemahaman yang kuat.`,
        actionLabel: 'Pelajari Materi Dasar',
        actionUrl: '/student/materi',
        recommendedTopics: [
          { title: 'Aljabar & Persamaan Linear (Konsep Dasar)', difficulty: 'Mudah', estimatedDurationMinutes: 30, icon: '➕' },
          { title: 'Analisis Paragraf & Ide Pokok (Membaca Intensif)', difficulty: 'Mudah', estimatedDurationMinutes: 25, icon: '📝' },
          { title: 'Operasi Pecahan & Persentase Sederhana', difficulty: 'Mudah', estimatedDurationMinutes: 35, icon: '➗' }
        ]
      }
    }

    if (lastPercentage >= 80) {
      return {
        level: 'TANTANGAN_HOTS',
        lastExamTitle,
        lastPercentage,
        message: `Luar biasa! Skor Try Out terakhirmu sangat tinggi (${lastPercentage}%). Mari asah logikamu dengan soal-soal tantangan HOTS (Higher Order Thinking Skills) untuk memantapkan poin tertinggimu.`,
        actionLabel: 'Mulai Latihan HOTS',
        actionUrl: '/student/tryout',
        recommendedTopics: [
          { title: 'Penalaran Kuantitatif Kompleks & Kombinatorika', difficulty: 'Sulit', estimatedDurationMinutes: 60, icon: '⚡' },
          { title: 'Analisis Teks Filsafat & Logika Bahasa', difficulty: 'Sulit', estimatedDurationMinutes: 40, icon: '🧠' },
          { title: 'Teori Peluang & Grafik Data UTBK', difficulty: 'Sulit', estimatedDurationMinutes: 50, icon: '📈' }
        ]
      }
    }

    // Default Medium (60 - 79)
    return {
      level: 'PEMANTAPAN_KONSISTENSI',
      lastExamTitle,
      lastPercentage,
      message: `Kerja bagus! Hasil Try Out terakhirmu sudah berada di jalur yang benar (${lastPercentage}%). Mari tingkatkan konsistensi dengan latihan soal tingkat menengah secara teratur.`,
      actionLabel: 'Latihan Soal Menengah',
      actionUrl: '/student/materi',
      recommendedTopics: [
        { title: 'Sistem Persamaan Kuadrat & Fungsi Kuadrat', difficulty: 'Sedang', estimatedDurationMinutes: 45, icon: '📊' },
        { title: 'Analisis Hubungan Logis Antar Paragraf', difficulty: 'Sedang', estimatedDurationMinutes: 30, icon: '🔍' },
        { title: 'Penalaran Logis & Diagram Venn', difficulty: 'Sedang', estimatedDurationMinutes: 35, icon: '🎯' }
      ]
    }
  }
}
