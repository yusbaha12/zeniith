/*
Tujuan: Menyediakan kontrak tipe frontend untuk fitur gamifikasi murid.
Caller: gamification.api.ts, dashboard murid, dan halaman `/student/gamifikasi`.
Dependensi: Tidak ada.
Main Functions: Menstandarkan bentuk karakter, profil XP, badge, quest, dan snapshot gamifikasi dari API.
Side Effects: Tidak ada; file type murni.
*/

export type GamificationCharacterCode = 'ASTRA' | 'NOVA' | 'LUMI' | 'RAKA'
export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type QuestType = 'DAILY' | 'WEEKLY' | 'EVENT'
export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'CLAIMED' | 'EXPIRED'

export interface FrontendCharacterEvolution {
  levelRequired: number
  titleSuffix: string
  visualCue: string
}

export interface FrontendCharacterDefinition {
  code: GamificationCharacterCode
  name: string
  theme: string
  personality: string
  visualCue: string
  evolutions?: FrontendCharacterEvolution[]
}

export interface FrontendGamificationProfile {
  userId: string
  characterCode: GamificationCharacterCode
  character: FrontendCharacterDefinition
  level: number
  totalXp: number
  currentLevelXp: number
  nextLevelXp: number
  progressPercent: number
  currentStreak: number
  longestStreak: number
  streakShields: number
  lastActivityDate: string | null
}

export interface FrontendStudentBadge {
  id: string
  code: string
  name: string
  description: string
  category: string
  tier: BadgeTier
  earnedAt: string
}

export interface FrontendStudentQuest {
  id: string
  code: string
  type: QuestType
  title: string
  description: string
  xpReward: number
  progressValue: number
  targetValue: number
  status: QuestStatus
  startsAt: string
  endsAt: string
}

export interface FrontendGamificationSnapshot {
  profile: FrontendGamificationProfile
  characters: FrontendCharacterDefinition[]
  recentBadges: FrontendStudentBadge[]
  activeQuests: FrontendStudentQuest[]
}
