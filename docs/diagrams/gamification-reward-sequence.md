<!--
Tujuan: Menggambarkan sequence reward gamifikasi dari aktivitas belajar/ujian sampai XP, quest, badge, notifikasi, dan dashboard murid ter-update.
Caller: Developer backend/frontend dan reviewer yang mengimplementasikan modul gamifikasi.
Dependensi: lms-bimbel-docs/docs/gamification.md, material progress flow, exam grading flow, NotificationService, PostgreSQL, dan Redis.
Main Functions: Menjelaskan urutan Material/Exam Use Case, RewardEvent, GamificationService, repository, notification, dan frontend refresh.
Side Effects: Dokumentasi diagram saja; tidak ada DB write, HTTP call, atau file I/O runtime.
-->

# Gamification Reward Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Student as Murid
    participant FE as SvelteKit UI
    participant API as Elysia Controller
    participant UC as Material/Exam Use Case
    participant DB as PostgreSQL
    participant G as GamificationService
    participant GR as GamificationRepository
    participant R as Redis
    participant N as NotificationService

    Student->>FE: Selesaikan materi / submit try out
    FE->>API: POST progress atau submit session
    API->>UC: execute(input)
    UC->>DB: Simpan progress / hasil utama
    DB-->>UC: Commit berhasil
    UC->>G: publish RewardEvent
    G->>GR: cek idempotency xp_ledger
    GR->>DB: SELECT ledger by student_id + event_type + source_id
    DB-->>GR: Not found
    G->>GR: applyReward(event, xp, badge, quest)
    GR->>DB: INSERT xp_ledger + UPDATE student_profiles
    GR->>DB: UPSERT student_badges / student_quests
    G->>R: Update weekly XP leaderboard + cache profile
    G->>N: Kirim notifikasi reward
    N-->>FE: Toast/in-app reward
    FE->>API: GET /api/gamification/me
    API->>G: getStudentSnapshot(studentId)
    G->>R: Baca cache profile
    R-->>G: Snapshot terbaru
    G-->>API: Profile, level, XP, streak, badge
    API-->>FE: Response sukses
    FE-->>Student: Panel gamifikasi ter-update
```
