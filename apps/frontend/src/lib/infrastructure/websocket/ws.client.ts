/*
Tujuan: Menyediakan WebSocket client ringan untuk realtime frontend fase 5.
Caller: Store ujian, leaderboard, proctoring, dan komponen yang butuh subscribe event.
Dependensi: VITE_WS_URL dan runtime browser WebSocket.
Main Functions: Connect, reconnect, queue send saat socket belum open, dan kelola listener event per nama.
Side Effects: Membuka koneksi WebSocket browser dan mengirim event ke backend.
*/

type Listener = (payload: unknown) => void

const getWsUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return `ws://${hostname}:3000/ws`
    }
  }
  return import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000/ws'
}

const WS_URL = getWsUrl()

class WsClient {
  private socket: WebSocket | null = null
  private listeners = new Map<string, Set<Listener>>()
  private reconnectTimer: number | null = null
  private pendingMessages: string[] = []

  connect(): void {
    if (
      typeof window === 'undefined' ||
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    this.socket = new WebSocket(WS_URL)

    this.socket.addEventListener('open', () => {
      for (const message of this.pendingMessages) {
        this.socket?.send(message)
      }

      this.pendingMessages = []
    })

    this.socket.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(event.data) as { event: string; payload: unknown }
        const handlers = this.listeners.get(parsed.event)
        handlers?.forEach((listener) => listener(parsed.payload))
      } catch {
        // abaikan payload tidak valid agar UI tetap stabil
      }
    })

    this.socket.addEventListener('close', () => {
      this.socket = null
      this.scheduleReconnect()
    })
  }

  on(eventName: string, listener: Listener): () => void {
    const current = this.listeners.get(eventName) ?? new Set<Listener>()
    current.add(listener)
    this.listeners.set(eventName, current)

    return () => {
      current.delete(listener)
      if (current.size === 0) {
        this.listeners.delete(eventName)
      }
    }
  }

  send(eventName: string, payload: unknown): void {
    this.connect()
    const serialized = JSON.stringify({ event: eventName, payload })

    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.pendingMessages.push(serialized)
      return
    }

    this.socket.send(serialized)
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || typeof window === 'undefined') {
      return
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 3000)
  }
}

export const wsClient = new WsClient()
