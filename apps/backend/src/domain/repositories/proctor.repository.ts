/*
Tujuan: Mendefinisikan kontrak repository proctoring untuk log dan warning fase 6.
Caller: Use case proctoring, WS handler, dan monitor controller.
Dependensi: Entitas proctor dan type data transfer.
Main Functions: Kontrak operasi baca/tulis log kecurangan dan warning peserta ujian.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { ProctorLogEntity, ProctorWarningEntity } from '../entities/proctor.entity'

export interface LiveProctorParticipant {
  sessionId: string
  userId: string
  name: string
  branchName: string | null
  status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'TERMINATED'
  warningCount: number
  lastHeartbeatAt: Date | null
  startedAt: Date
  submittedAt: Date | null
}

export interface IProctorRepository {
  saveLog(log: Omit<ProctorLogEntity, 'id' | 'occurredAt'>): Promise<ProctorLogEntity>
  saveWarning(warning: Omit<ProctorWarningEntity, 'id' | 'createdAt'>): Promise<ProctorWarningEntity>
  incrementSessionWarningCount(sessionId: string): Promise<number>
  getLogsBySessionId(sessionId: string): Promise<ProctorLogEntity[]>
  getLiveProctorData(examId: string): Promise<LiveProctorParticipant[]>
}
