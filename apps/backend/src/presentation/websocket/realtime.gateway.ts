/*
Tujuan: Menyediakan gateway WebSocket fase 5 untuk timer sinkron ujian dan leaderboard realtime.
Caller: Bootstrap backend index dan frontend student via endpoint `/ws`.
Dependensi: ElysiaJS WebSocket route, repository sesi ujian, LeaderboardService, dan kontrak WS shared.
Main Functions: Mengelola subscribe/unsubscribe timer ujian, subscribe leaderboard, dan broadcast snapshot live ke klien terkait.
Side Effects: Membuka endpoint WebSocket, menyimpan state koneksi in-memory, dan mengirim payload realtime ke browser.
*/

import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type ExamJoinPayload,
  type LeaderboardSubscribePayload
} from '@lms-bimbel/shared'
import { Elysia } from 'elysia'
import Redis from 'ioredis'

import { LeaderboardService } from '../../application/services/leaderboard.service'
import type { IExamRepository } from '../../domain/repositories/exam.repository'
import type { IUserRepository } from '../../domain/repositories/user.repository'
import type { LogProctorEventUseCase } from '../../application/use-cases/proctor/log-proctor-event.usecase'

interface ExamSubscriptionState {
  sessionId: string
  expiresAt: number
}

interface ConnectionState {
  ws: any
  exam: ExamSubscriptionState | null
  leaderboardSubscriptions: Map<string, string | null>
  proctorExamId: string | null
}

const parseEnvelope = (message: unknown): { event: string; payload: unknown } | null => {
  if (typeof message !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(message) as { event?: string; payload?: unknown }

    if (!parsed?.event || typeof parsed.event !== 'string') {
      return null
    }

    return {
      event: parsed.event,
      payload: parsed.payload
    }
  } catch {
    return null
  }
}

export class RealtimeGateway {
  private readonly connections = new Map<any, ConnectionState>()
  private ticker: ReturnType<typeof setInterval> | null = null
  private readonly pubClient: Redis | null = null
  private readonly subClient: Redis | null = null

  constructor(
    private readonly examRepository: IExamRepository,
    private readonly userRepository: IUserRepository,
    private readonly leaderboardService: LeaderboardService,
    private readonly logProctorEventUseCase: LogProctorEventUseCase,
    redisUrl?: string
  ) {
    if (redisUrl) {
      this.pubClient = new Redis(redisUrl, { lazyConnect: true })
      this.subClient = new Redis(redisUrl, { lazyConnect: true })
      void this.setupRedisPubSub()
    }
  }

  private async setupRedisPubSub(): Promise<void> {
    if (!this.subClient) return

    try {
      await this.subClient.connect()
      await this.pubClient?.connect()

      await this.subClient.subscribe('ws:proctor_alerts')
      await this.subClient.subscribe('ws:leaderboard_updates')
      await this.subClient.subscribe('ws:proctor_warnings')

      this.subClient.on('message', async (channel, message) => {
        try {
          const data = JSON.parse(message)

          if (channel === 'ws:proctor_alerts') {
            this.broadcastProctorAlertLocal(data.examId, data.alertPayload)
          } else if (channel === 'ws:leaderboard_updates') {
            await this.broadcastLeaderboardUpdateLocal(data.examId)
          } else if (channel === 'ws:proctor_warnings') {
            this.sendProctorWarningLocal(
              data.sessionId,
              data.userId,
              data.message,
              data.warningCount,
              data.terminated
            )
          }
        } catch (err) {
          console.error('[RealtimeGateway.RedisSub] Parsing error:', err)
        }
      })
    } catch (err) {
      console.error('[RealtimeGateway.RedisSub] Connection error:', err)
    }
  }

  controller() {
    return new Elysia().ws('/ws', {
      open: (ws) => {
        this.connections.set(ws, {
          ws,
          exam: null,
          leaderboardSubscriptions: new Map(),
          proctorExamId: null
        })

        this.ensureTicker()
      },
      message: async (ws, message) => {
        const envelope = parseEnvelope(message)

        if (!envelope) {
          ws.send(JSON.stringify({
            event: SERVER_EVENTS.ERROR,
            payload: { message: 'Format pesan WebSocket tidak valid' }
          }))
          return
        }

        const connection = this.connections.get(ws)
        if (!connection) {
          return
        }

        if (envelope.event === CLIENT_EVENTS.EXAM_JOIN) {
          await this.handleExamJoin(connection, envelope.payload as ExamJoinPayload)
          return
        }

        if (envelope.event === CLIENT_EVENTS.EXAM_LEAVE) {
          connection.exam = null
          return
        }

        if (envelope.event === CLIENT_EVENTS.LEADERBOARD_SUBSCRIBE) {
          await this.handleLeaderboardSubscribe(connection, envelope.payload as LeaderboardSubscribePayload)
          return
        }

        if (envelope.event === CLIENT_EVENTS.LEADERBOARD_UNSUBSCRIBE) {
          const payload = envelope.payload as LeaderboardSubscribePayload | null

          if (payload?.examId) {
            connection.leaderboardSubscriptions.delete(payload.examId)
          }
          return
        }

        if (envelope.event === CLIENT_EVENTS.PROCTOR_MONITOR) {
          const payload = envelope.payload as { examId: string }
          connection.proctorExamId = payload.examId
          return
        }

        if (envelope.event === CLIENT_EVENTS.PROCTOR_EVENT) {
          const payload = envelope.payload as { sessionId: string; eventType: any; metadata?: any }
          await this.handleProctorEvent(connection, payload)
          return
        }
      },
      close: (ws) => {
        this.connections.delete(ws)

        if (this.connections.size === 0 && this.ticker) {
          clearInterval(this.ticker)
          this.ticker = null
        }
      }
    })
  }

  async broadcastLeaderboardUpdate(examId: string): Promise<void> {
    if (this.pubClient) {
      await this.pubClient.publish('ws:leaderboard_updates', JSON.stringify({ examId }))
    } else {
      await this.broadcastLeaderboardUpdateLocal(examId)
    }
  }

  private async broadcastLeaderboardUpdateLocal(examId: string): Promise<void> {
    const tasks: Promise<void>[] = []

    for (const connection of this.connections.values()) {
      const currentSessionId = connection.leaderboardSubscriptions.get(examId)

      if (!connection.leaderboardSubscriptions.has(examId)) {
        continue
      }

      tasks.push((async () => {
        const snapshot = await this.leaderboardService.buildSnapshot(examId, currentSessionId ?? null)
        connection.ws.send(JSON.stringify({
          event: SERVER_EVENTS.LEADERBOARD_UPDATE,
          payload: snapshot
        }))
      })())
    }

    await Promise.all(tasks)
  }

  private ensureTicker(): void {
    if (this.ticker) {
      return
    }

    this.ticker = setInterval(() => {
      const now = Date.now()

      for (const connection of this.connections.values()) {
        if (!connection.exam) {
          continue
        }

        const timeLeft = Math.max(0, Math.floor((connection.exam.expiresAt - now) / 1000))
        connection.ws.send(JSON.stringify({
          event: SERVER_EVENTS.EXAM_TICK,
          payload: {
            sessionId: connection.exam.sessionId,
            timeLeft
          }
        }))

        if (timeLeft <= 0) {
          connection.ws.send(JSON.stringify({
            event: SERVER_EVENTS.EXAM_ENDED,
            payload: {
              sessionId: connection.exam.sessionId,
              timeLeft
            }
          }))
          connection.exam = null
        }
      }
    }, 1000)
  }

  private async handleExamJoin(connection: ConnectionState, payload: ExamJoinPayload): Promise<void> {
    const session = await this.examRepository.findSessionById(payload.sessionId)

    if (!session) {
      connection.ws.send(JSON.stringify({
        event: SERVER_EVENTS.ERROR,
        payload: { message: 'Sesi ujian tidak ditemukan' }
      }))
      return
    }

    connection.exam = {
      sessionId: session.id,
      expiresAt: session.expiresAt.getTime()
    }
  }

  private async handleLeaderboardSubscribe(
    connection: ConnectionState,
    payload: LeaderboardSubscribePayload
  ): Promise<void> {
    connection.leaderboardSubscriptions.set(payload.examId, payload.sessionId ?? null)

    const snapshot = await this.leaderboardService.buildSnapshot(payload.examId, payload.sessionId ?? null)
    connection.ws.send(JSON.stringify({
      event: SERVER_EVENTS.LEADERBOARD_UPDATE,
      payload: snapshot
    }))
  }

  private async handleProctorEvent(
    connection: ConnectionState,
    payload: { sessionId: string; eventType: any; metadata?: any }
  ): Promise<void> {
    try {
      const session = await this.examRepository.findSessionById(payload.sessionId)
      if (!session) {
        return
      }

      const result = await this.logProctorEventUseCase.execute({
        sessionId: payload.sessionId,
        userId: session.userId,
        eventType: payload.eventType,
        metadata: payload.metadata ?? {}
      })

      const studentName = await this.getStudentName(session.userId)
      const alertPayload = {
        sessionId: session.id,
        userId: session.userId,
        name: studentName,
        status: result.terminated ? 'TERMINATED' : session.status,
        warningCount: result.warningCount,
        eventType: payload.eventType,
        occurredAt: new Date().toISOString()
      }

      this.broadcastProctorAlert(session.examId, alertPayload)

      if (result.terminated) {
        for (const conn of this.connections.values()) {
          if (conn.exam?.sessionId === payload.sessionId) {
            conn.ws.send(JSON.stringify({
              event: SERVER_EVENTS.PROCTOR_TERMINATED,
              payload: { message: 'Sesi ujian Anda dihentikan karena terdeteksi pelanggaran proctoring.' }
            }))
            conn.exam = null
          }
        }
      }
    } catch (err) {
      console.error('[RealtimeGateway.handleProctorEvent] Error:', err)
    }
  }

  private broadcastProctorAlert(examId: string, alertPayload: any): void {
    if (this.pubClient) {
      void this.pubClient.publish('ws:proctor_alerts', JSON.stringify({ examId, alertPayload }))
    } else {
      this.broadcastProctorAlertLocal(examId, alertPayload)
    }
  }

  private broadcastProctorAlertLocal(examId: string, alertPayload: any): void {
    const message = JSON.stringify({
      event: SERVER_EVENTS.PROCTOR_ALERT,
      payload: alertPayload
    })

    for (const connection of this.connections.values()) {
      if (connection.proctorExamId === examId) {
        connection.ws.send(message)
      }
    }
  }

  async sendProctorWarning(
    sessionId: string,
    userId: string,
    message: string,
    warningCount: number,
    terminated: boolean
  ): Promise<void> {
    if (this.pubClient) {
      await this.pubClient.publish('ws:proctor_warnings', JSON.stringify({
        sessionId,
        userId,
        message,
        warningCount,
        terminated
      }))
    } else {
      this.sendProctorWarningLocal(sessionId, userId, message, warningCount, terminated)
    }

    const session = await this.examRepository.findSessionById(sessionId)
    if (session) {
      const studentName = await this.getStudentName(userId)
      const alertPayload = {
        sessionId,
        userId,
        name: studentName,
        status: terminated ? 'TERMINATED' : 'ACTIVE',
        warningCount,
        eventType: 'MANUAL_WARNING',
        occurredAt: new Date().toISOString(),
        message
      }
      this.broadcastProctorAlert(session.examId, alertPayload)
    }
  }

  private sendProctorWarningLocal(
    sessionId: string,
    userId: string,
    message: string,
    warningCount: number,
    terminated: boolean
  ): void {
    for (const conn of this.connections.values()) {
      if (conn.exam?.sessionId === sessionId) {
        if (terminated) {
          conn.ws.send(JSON.stringify({
            event: SERVER_EVENTS.PROCTOR_TERMINATED,
            payload: { message }
          }))
          conn.exam = null
        } else {
          conn.ws.send(JSON.stringify({
            event: SERVER_EVENTS.EXAM_WARNING,
            payload: { message, warningCount }
          }))
        }
      }
    }
  }

  async terminateSessionRealtime(sessionId: string): Promise<void> {
    const session = await this.examRepository.findSessionById(sessionId)
    if (!session) return

    if (this.pubClient) {
      await this.pubClient.publish('ws:proctor_warnings', JSON.stringify({
        sessionId,
        userId: session.userId,
        message: 'Sesi ujian Anda dihentikan paksa oleh pengawas.',
        warningCount: session.warningCount,
        terminated: true
      }))
    } else {
      this.terminateSessionRealtimeLocal(sessionId)
    }

    const studentName = await this.getStudentName(session.userId)
    const alertPayload = {
      sessionId,
      userId: session.userId,
      name: studentName,
      status: 'TERMINATED',
      warningCount: session.warningCount,
      eventType: 'FORCE_TERMINATE',
      occurredAt: new Date().toISOString()
    }
    this.broadcastProctorAlert(session.examId, alertPayload)
  }

  private terminateSessionRealtimeLocal(sessionId: string): void {
    for (const conn of this.connections.values()) {
      if (conn.exam?.sessionId === sessionId) {
        conn.ws.send(JSON.stringify({
          event: SERVER_EVENTS.PROCTOR_TERMINATED,
          payload: { message: 'Sesi ujian Anda dihentikan paksa oleh pengawas.' }
        }))
        conn.exam = null
      }
    }
  }

  private async getStudentName(userId: string): Promise<string> {
    try {
      const user = await this.userRepository.findById(userId)
      return user?.name ?? 'Siswa'
    } catch {
      return 'Siswa'
    }
  }
}

