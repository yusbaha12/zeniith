/*
Tujuan: Mendefinisikan event dan payload WebSocket bersama untuk sinkronisasi exam, leaderboard, dan proctoring.
Caller: Gateway backend, WebSocket client frontend, dan handler event.
Dependensi: TypeScript type system.
Main Functions: Menyediakan konstanta event client/server dan payload interface inti untuk timer sinkron, leaderboard live, dan proctoring.
Side Effects: Tidak ada; file kontrak type murni.
*/

export const CLIENT_EVENTS = {
  EXAM_JOIN: 'exam:join',
  EXAM_LEAVE: 'exam:leave',
  LEADERBOARD_SUBSCRIBE: 'leaderboard:subscribe',
  LEADERBOARD_UNSUBSCRIBE: 'leaderboard:unsubscribe',
  PROCTOR_MONITOR: 'proctor:monitor',
  PROCTOR_EVENT: 'proctor:event'
} as const

export const SERVER_EVENTS = {
  EXAM_TICK: 'exam:tick',
  EXAM_WARNING: 'exam:warning',
  EXAM_ENDED: 'exam:ended',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  PROCTOR_ALERT: 'proctor:alert',
  PROCTOR_TERMINATED: 'proctor:terminated',
  NOTIFICATION_NEW: 'notification:new',
  ERROR: 'error'
} as const

export type ClientEvent = typeof CLIENT_EVENTS[keyof typeof CLIENT_EVENTS]
export type ServerEvent = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS]

export interface ExamTickPayload {
  sessionId: string
  timeLeft: number
}

export interface ExamWarningPayload {
  sessionId: string
  timeLeft: number
  message: string
}

export interface ExamJoinPayload {
  sessionId: string
}

export interface LeaderboardEntryWS {
  rank: number
  userId: string
  name: string
  branchName: string
  score: number
  percentage: number
  durationSeconds: number
}

export interface LeaderboardUpdatePayload {
  examId: string
  totalParticipants: number
  currentSessionRank: number | null
  currentSessionId: string | null
  updatedAt: string
  entries: LeaderboardEntryWS[]
}

export interface LeaderboardSubscribePayload {
  examId: string
  sessionId?: string | null
}

export type ProctorEventType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'RIGHT_CLICK'
  | 'KEYBOARD_SHORTCUT'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
