<!--
Tujuan: Mendokumentasikan sequence diagram fase 5 untuk timer sinkron ujian dan leaderboard realtime.
Caller: Developer, reviewer, dan sesi Codex berikutnya saat menelusuri implementasi fase 5.
Dependensi: Implementasi backend/frontend fase 5, SYSTEM_MAP.md, dan docs fase proyek.
Main Functions: Menjelaskan alur join WebSocket, tick timer, submit ujian, grading, cache Redis, dan broadcast leaderboard.
Side Effects: Dokumentasi saja; tidak ada DB write, HTTP call, atau file I/O runtime.
-->

# Phase 5 — Realtime Timer & Leaderboard

```mermaid
sequenceDiagram
    participant StudentUI as Student UI
    participant WS as RealtimeGateway /ws
    participant ExamAPI as ExamController
    participant Queue as ExamProcessingQueue
    participant Repo as ExamRepository
    participant Leaderboard as LeaderboardService
    participant Redis as Redis

    StudentUI->>ExamAPI: GET /api/sessions/:id
    ExamAPI->>Repo: findSession + questions + answers
    Repo-->>ExamAPI: snapshot sesi
    ExamAPI-->>StudentUI: session snapshot

    StudentUI->>WS: exam:join { sessionId }
    WS->>Repo: findSessionById(sessionId)
    Repo-->>WS: expiresAt
    loop setiap 1 detik
        WS-->>StudentUI: exam:tick { sessionId, timeLeft }
    end

    StudentUI->>ExamAPI: POST /api/sessions/:id/submit
    ExamAPI->>Queue: processSubmitNow / enqueue submit
    Queue->>Repo: saveResult(...)
    Queue->>Leaderboard: recordResult(sessionId)
    Leaderboard->>Redis: ZADD leaderboard:exam:{examId}
    Leaderboard->>Redis: PUBLISH leaderboard:update
    Queue->>WS: broadcastLeaderboardUpdate(examId)
    WS->>Leaderboard: buildSnapshot(examId, sessionId?)
    Leaderboard->>Repo: query top 10 + total + current rank
    Repo-->>Leaderboard: leaderboard rows
    Leaderboard-->>WS: snapshot leaderboard
    WS-->>StudentUI: leaderboard:update
```
