<!--
Tujuan: Mendokumentasikan sequence diagram fase 3 untuk alur ruang belajar guru, akses materi murid, dan progress belajar.
Caller: Developer, reviewer, dan sesi implementasi lanjutan modul ruang belajar.
Dependensi: Teacher material controller, material controller, subscription middleware, object storage, dan repository learning.
Main Functions: Menjelaskan urutan create materi guru, akses materi murid dengan subscription aktif, dan update progress material.
Side Effects: Dokumentasi saja; tidak ada efek runtime.
-->

# Sequence Diagram Fase 3

```mermaid
sequenceDiagram
    participant Teacher as Guru
    participant Student as Murid
    participant Frontend as SvelteKit Frontend
    participant Backend as ElysiaJS Backend
    participant UseCase as Material Use Case
    participant Guard as Subscription Middleware
    participant Storage as MinIO/S3
    participant DB as PostgreSQL

    Teacher->>Frontend: Buka /teacher/materi dan pilih buat materi
    Frontend->>Backend: GET /api/subjects dan GET /api/subjects/:id/modules
    Backend->>UseCase: Ambil subject + module aktif
    UseCase->>DB: Query subjects/modules by active + sort order
    DB-->>UseCase: Data subject dan module
    Backend-->>Frontend: Form metadata materi siap

    Teacher->>Frontend: Tulis konten Tiptap dan simpan materi
    Frontend->>Backend: POST /api/teacher/materials (multipart)
    Backend->>UseCase: Validasi module, tipe materi, attachment, dan slug
    alt Ada attachment
        UseCase->>Storage: Upload object attachment
        Storage-->>UseCase: Object key attachment
    end
    UseCase->>DB: Insert material baru by teacher
    DB-->>UseCase: Material created
    Backend-->>Frontend: Ringkasan materi berhasil dibuat

    Student->>Frontend: Buka /student/materi
    Frontend->>Backend: GET /api/subjects dan GET /api/subjects/:id/modules
    Backend->>UseCase: Ambil katalog ruang belajar
    UseCase->>DB: Query subject/module aktif
    DB-->>UseCase: Struktur ruang belajar
    Backend-->>Frontend: Subject dan module tampil

    Student->>Frontend: Pilih module
    Frontend->>Backend: GET /api/modules/:id/materials
    Backend->>Guard: Validasi subscription aktif murid
    Guard->>DB: Query subscription aktif by user + ends_at
    DB-->>Guard: Access granted
    Guard-->>Backend: Lanjut ke use case
    Backend->>UseCase: Ambil list materi + progress murid
    UseCase->>DB: Query materials by module + left join material_progresses
    DB-->>UseCase: Daftar materi + status progress
    Backend-->>Frontend: Materi module tampil

    Student->>Frontend: Buka detail materi dan tandai selesai
    Frontend->>Backend: GET /api/materials/:id lalu POST /api/materials/:id/progress
    Backend->>Guard: Validasi subscription aktif
    Guard->>DB: Query subscription aktif
    DB-->>Guard: Access granted
    Backend->>UseCase: Ambil detail materi dan upsert progress
    UseCase->>Storage: Generate signed URL attachment/image jika perlu
    Storage-->>UseCase: URL akses materi
    UseCase->>DB: Upsert material_progresses by user + material
    DB-->>UseCase: Progress terbaru tersimpan
    Backend-->>Frontend: Detail materi dan progres terbaru
```
