/*
Tujuan: Merepresentasikan tipe dan entitas domain gamifikasi murid.
Caller: Use case, service, repository interface, dan controller gamifikasi.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menyediakan union karakter/event/tier/quest, metadata karakter, dan helper profile snapshot.
Side Effects: Tidak ada; entitas domain murni.
*/

export type GamificationCharacterCode = 'ASTRA' | 'NOVA' | 'LUMI' | 'RAKA'
export type GamificationEventType =
  | 'MATERIAL_COMPLETED'
  | 'MODULE_COMPLETED'
  | 'PRACTICE_COMPLETED'
  | 'EXAM_SUBMITTED'
  | 'EXAM_GRADED'
  | 'PROCTOR_CLEAN_EXAM'
  | 'DAILY_STREAK'
  | 'QUEST_CLAIMED'
export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type QuestType = 'DAILY' | 'WEEKLY' | 'EVENT'
export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'CLAIMED' | 'EXPIRED'

export interface CharacterEvolution {
  levelRequired: number
  titleSuffix: string
  visualCue: string
}

export interface CharacterDefinition {
  code: GamificationCharacterCode
  name: string
  theme: string
  personality: string
  visualCue: string
  evolutions: CharacterEvolution[]
}

export const CHARACTER_DEFINITIONS: CharacterDefinition[] = [
  {
    code: 'ASTRA',
    name: 'Astra si Penjelajah',
    theme: 'Sains & Eksplorasi',
    personality: 'Penasaran dan cepat mencoba hal baru',
    visualCue: 'Jaket biru, pin bintang, tablet belajar',
    evolutions: [
      { levelRequired: 10, titleSuffix: 'Pionir', visualCue: 'Jaket biru dengan emblem perak, kacamata pelindung, tablet hologram' },
      { levelRequired: 30, titleSuffix: 'Penemu', visualCue: 'Jubah sci-fi biru neon, drone pendamping kecil, sarung tangan pintar' }
    ]
  },
  {
    code: 'NOVA',
    name: 'Nova si Strategis',
    theme: 'Try Out & Ranking',
    personality: 'Tenang, analitis, dan rapi menyusun target',
    visualCue: 'Hoodie putih-lavender, papan taktik mini',
    evolutions: [
      { levelRequired: 10, titleSuffix: 'Ahli Taktik', visualCue: 'Hoodie teknologi dengan trim emas, kacamata AR analitik' },
      { levelRequired: 30, titleSuffix: 'Master Strategi', visualCue: 'Jubah putih elegan dengan aksen ungu bercahaya, proyeksi peta pikiran melayang' }
    ]
  },
  {
    code: 'LUMI',
    name: 'Lumi si Kreatif',
    theme: 'Materi & Catatan',
    personality: 'Ceria, ekspresif, dan suka merangkum',
    visualCue: 'Sweater mint, pensil digital, stiker warna',
    evolutions: [
      { levelRequired: 10, titleSuffix: 'Inovator', visualCue: 'Sweater pastel dengan pin bercahaya, tablet gambar raksasa transparan' },
      { levelRequired: 30, titleSuffix: 'Maestro', visualCue: 'Pakaian artis modern dengan kuas cahaya, aura warna-warni yang mengelilingi' }
    ]
  },
  {
    code: 'RAKA',
    name: 'Raka si Tangguh',
    theme: 'Konsistensi & Streak',
    personality: 'Disiplin, stabil, dan pantang menyerah',
    visualCue: 'Varsity jacket merah muda, stopwatch',
    evolutions: [
      { levelRequired: 10, titleSuffix: 'Atlet', visualCue: 'Jaket olahraga futuristik merah terang, jam tangan AI' },
      { levelRequired: 30, titleSuffix: 'Legenda', visualCue: 'Armor ringan mecha-sport merah emas, aura energi api biru' }
    ]
  }
]

export class StudentProfileEntity {
  constructor(
    public readonly userId: string,
    public readonly characterCode: GamificationCharacterCode,
    public readonly level: number,
    public readonly totalXp: number,
    public readonly currentStreak: number,
    public readonly longestStreak: number,
    public readonly streakShields: number,
    public readonly lastActivityDate: string | null,
    public readonly updatedAt: Date
  ) {}

  getCharacter(): CharacterDefinition {
    return CHARACTER_DEFINITIONS.find((character) => character.code === this.characterCode) ?? CHARACTER_DEFINITIONS[0]
  }
}

export interface StudentBadgeSummary {
  id: string
  code: string
  name: string
  description: string
  category: string
  tier: BadgeTier
  earnedAt: Date
}

export interface StudentQuestSummary {
  id: string
  code: string
  type: QuestType
  title: string
  description: string
  xpReward: number
  progressValue: number
  targetValue: number
  status: QuestStatus
  startsAt: Date
  endsAt: Date
}
