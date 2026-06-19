<!--
Tujuan: Mendokumentasikan sequence diagram fase 4 untuk teacher exam management, sesi ujian murid, submit jawaban, grading, dan hasil.
Caller: Developer, reviewer, dan sesi implementasi lanjutan modul try out.
Dependensi: Teacher exam controller, exam controller, exam processing queue, subscription middleware, dan repository exam.
Main Functions: Menjelaskan alur create ujian, create soal, start session, submit jawaban, submit akhir, dan perhitungan hasil.
Side Effects: Dokumentasi saja; tidak ada efek runtime.
-->

# Sequence Diagram Fase 4

```mermaid
sequenceDiagram
    participant Teacher as Guru
    participant Student as Murid
    participant Frontend as SvelteKit Frontend
    participant Backend as ElysiaJS Backend
    participant Guard as Subscription Middleware
    participant UseCase as Exam Use Case
    participant Queue as BullMQ Exam Queue
    participant DB as PostgreSQL
    participant Redis as Redis

    Teacher->>Frontend: Buka /teacher/ujian dan buat ujian baru
    Frontend->>Backend: POST /api/teacher/exams
    Backend->>UseCase: Validasi jadwal, slug, dan metadata exam
    UseCase->>DB: Insert exams
    DB-->>UseCase: Exam created
    Backend-->>Frontend: Ringkasan ujian baru

    Teacher->>Frontend: Tambah soal dan opsi jawaban
    Frontend->>Backend: POST /api/teacher/exams/:id/questions
    Backend->>UseCase: Validasi opsi benar dan bobot soal
    UseCase->>DB: Insert questions + options
    UseCase->>DB: Recalculate total_questions + total_score
    Backend-->>Frontend: Soal berhasil dibuat

    Student->>Frontend: Buka /student/tryout
    Frontend->>Backend: GET /api/exams
    Backend->>Guard: Validasi subscription aktif murid
    Guard->>DB: Query subscription aktif by user
    DB-->>Guard: Access granted
    Backend->>UseCase: Ambil daftar ujian published + status user
    UseCase->>DB: Query exams, session aktif, dan result terakhir
    DB-->>UseCase: Daftar ujian
    Backend-->>Frontend: Try out list tampil

    Student->>Frontend: Mulai ujian
    Frontend->>Backend: POST /api/exams/:id/sessions
    Backend->>UseCase: Validasi availability dan sesi duplikat
    UseCase->>DB: Insert exam_sessions ACTIVE
    UseCase->>Queue: Schedule auto-submit delayed job
    Queue->>Redis: Simpan delayed job
    Backend-->>Frontend: Session + daftar soal sanitized

    Student->>Frontend: Pilih jawaban per soal
    Frontend->>Backend: POST /api/sessions/:id/answers
    Backend->>UseCase: Validasi sesi, soal, dan idempotency key
    UseCase->>Redis: SET NX TTL 60s untuk submit dedup
    UseCase->>Queue: Enqueue submit-answer
    UseCase->>DB: Upsert answers sinkron untuk cegah race submit akhir
    Queue->>DB: Upsert answers async idempoten
    Backend-->>Frontend: Jawaban diterima

    Student->>Frontend: Submit ujian
    Frontend->>Backend: POST /api/sessions/:id/submit
    Backend->>UseCase: Finalisasi sesi
    UseCase->>Queue: Enqueue submit-session
    Queue->>DB: Update session SUBMITTED
    Queue->>DB: Query questions + answers
    Queue->>UseCase: Hitung score, percentage, duration
    Queue->>DB: Upsert exam_results
    Backend-->>Frontend: Status submit berhasil

    Student->>Frontend: Buka halaman hasil
    Frontend->>Backend: GET /api/sessions/:id/result
    Backend->>UseCase: Ambil result dan review jawaban
    UseCase->>DB: Query exam_results + answers + questions
    DB-->>UseCase: Ringkasan hasil dan pembahasan
    Backend-->>Frontend: Skor, review, dan pembahasan tampil
```
