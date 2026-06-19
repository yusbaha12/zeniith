<!--
Tujuan: Mendokumentasikan sequence diagram fase 2 untuk alur katalog paket, checkout, verifikasi admin, dan aktivasi subscription.
Caller: Developer, reviewer, dan sesi implementasi lanjutan paket/pembayaran.
Dependensi: Package controller, order controller, admin order controller, object storage, dan subscription repository.
Main Functions: Menjelaskan urutan dari pemilihan paket sampai langganan murid aktif setelah admin approve pembayaran.
Side Effects: Dokumentasi saja; tidak ada efek runtime.
-->

# Sequence Diagram Fase 2

```mermaid
sequenceDiagram
    participant Student as Murid
    participant Admin as Admin Cabang
    participant Frontend as SvelteKit Frontend
    participant Backend as ElysiaJS Backend
    participant UseCase as Package/Order UseCase
    participant Storage as MinIO/S3
    participant DB as PostgreSQL
    participant Redis as Redis/BullMQ

    Student->>Frontend: Buka /paket dan pilih paket
    Frontend->>Backend: GET /api/packages dan GET /api/packages/:id
    Backend->>UseCase: Ambil katalog + detail paket
    UseCase->>DB: Query packages + package_features
    DB-->>UseCase: Data paket aktif
    UseCase-->>Backend: Summary + detail paket
    Backend-->>Frontend: Response katalog/detail

    Student->>Frontend: Upload bukti transfer dan checkout
    Frontend->>Backend: POST /api/orders (multipart)
    Backend->>UseCase: Validasi paket + payment method + file
    UseCase->>Storage: Upload bukti transfer
    Storage-->>UseCase: Object key bukti
    UseCase->>DB: Insert order status PENDING
    DB-->>UseCase: Order created
    UseCase-->>Backend: Ringkasan order
    Backend-->>Frontend: Order pending berhasil dibuat

    Admin->>Frontend: Buka /admin/pembayaran
    Frontend->>Backend: GET /api/admin/orders?status=PENDING
    Backend->>UseCase: Ambil daftar order cabang
    UseCase->>DB: Query orders by branch + status
    DB-->>UseCase: Daftar order pending
    UseCase->>Storage: Generate signed proof URL
    Storage-->>UseCase: Preview URL bukti
    Backend-->>Frontend: List order pending

    Admin->>Frontend: Approve pembayaran
    Frontend->>Backend: PATCH /api/admin/orders/:id/verify
    Backend->>UseCase: Verifikasi order + hitung masa paket
    UseCase->>DB: Update order PAID + deactivate subscription lama + create subscription baru
    DB-->>UseCase: Subscription aktif tersimpan
    UseCase->>Redis: Scheduler expiry tetap jalan periodik
    Redis-->>UseCase: Batch expiry pada waktunya
    Backend-->>Frontend: Approval berhasil

    Student->>Backend: GET /api/subscriptions/me/active
    Backend->>UseCase: Ambil subscription aktif
    UseCase->>DB: Query subscription aktif by user
    DB-->>UseCase: Paket aktif + tanggal berakhir
    Backend-->>Frontend: Status akses materi terbuka
```
