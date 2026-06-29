# SYSTEM_MAP — LMS Bimbel

Updated: 2026-06-27

## Stack Utama
- **Runtime**: Bun + ElysiaJS (backend), SvelteKit (frontend)
- **ORM**: Drizzle ORM + PostgreSQL
- **Queue**: BullMQ + Redis (ioredis)
- **Storage**: MinIO / S3-compatible (payment proofs, materials)
- **Auth**: JWT (jose), cookie-based
- **Monorepo**: `apps/backend`, `apps/frontend`, `packages/shared`

## Lapisan Arsitektur Backend
```
Presentation (HTTP Controller)
  → Application (Use Case → Service)
    → Domain (Entity, Interface Repository)
      → Infrastructure (Repository Impl, DB Schema, Mapper, Queue)
```

## Modul Order & Payment (Fokus Utama)

### Entry Points
- `POST /api/orders` — Murid buat order (checkout)
- `GET  /api/orders/my` — Riwayat order murid
- `GET  /api/subscriptions/me/active` — Status langganan aktif
- `GET  /api/admin/orders` — Daftar order per cabang (admin)
- `PATCH /api/admin/orders/:id/verify` — Approve/Reject manual (admin)
- **[BARU] POST /api/payments/midtrans/notification** — Webhook Midtrans (otomatis)
- **[BARU] POST /api/orders/:id/midtrans-token** — Murid minta Snap token
- **[BARU] GET  /api/orders/:id/status** — Polling status order murid

### Controllers
- `presentation/http/controllers/order.controller.ts` — student checkout
- `presentation/http/controllers/admin-order.controller.ts` — admin verify
- **[BARU] `presentation/http/controllers/payment-gateway.controller.ts`** — Midtrans webhook & token

### Use Cases
- `application/use-cases/order/purchase-package.usecase.ts`
- `application/use-cases/order/verify-order.usecase.ts`
- `application/use-cases/order/list-my-orders.usecase.ts`
- `application/use-cases/order/list-branch-orders.usecase.ts`
- **[BARU] `application/use-cases/order/create-midtrans-token.usecase.ts`**
- **[BARU] `application/use-cases/order/handle-midtrans-notification.usecase.ts`**

### Services
- `application/services/payment.service.ts` — generate order code, validasi proof, hitung subscription
- **[BARU] `application/services/midtrans.service.ts`** — Snap token, notification verify, signature hash

### Domain Entities & Interfaces
- `domain/entities/order.entity.ts` — OrderEntity
- `domain/repositories/order.repository.ts` — IOrderRepository
- `domain/repositories/subscription.repository.ts` — ISubscriptionRepository

### Infrastructure
- `infrastructure/repositories/order.repository.impl.ts`
- `infrastructure/repositories/subscription.repository.impl.ts`
- `infrastructure/database/schema/orders.schema.ts` — enum: PENDING|PAID|REJECTED|EXPIRED|REFUNDED
- `infrastructure/database/schema/subscriptions.schema.ts`
- **[BARU] Migration**: tambah kolom `midtrans_token`, `midtrans_order_id`, `payment_gateway` di orders

### Order Status Flow
```
PENDING → (Midtrans otomatis) → PAID → [subscription aktif]
PENDING → (Admin manual approve) → PAID → [subscription aktif]  
PENDING → (Admin manual reject) → REJECTED
PENDING → (timeout 48 jam) → EXPIRED [via scheduler]
```

### Payment Method Flow
```
BANK_TRANSFER → upload bukti → admin verify manual
QRIS / VIRTUAL_ACCOUNT → Midtrans Snap → webhook otomatis → PAID
```

## Modul Lain
- **Auth**: `auth.controller.ts` → JWT login/refresh/logout
- **Material**: materi video/PDF + progress tracking
- **Exam**: tryout + proctoring realtime (WebSocket)
- **Gamification**: leaderboard + XP
- **Subscription Guard**: middleware cek akses aktif murid
- **Queue Workers**: exam-processing, subscription-expiry, weekly-report

## Key Files
| Concern | File |
|---|---|
| DI Container | `src/container.ts` |
| Env Config | `src/application/services/config.service.ts` |
| DB Connection | `src/infrastructure/database/connection.ts` |
| Root .env | `/var/www/zeniith/lms-bimbel/.env` |
| Shared Types | `packages/shared/src/types/enums.ts` |
| Frontend API | `apps/frontend/src/lib/infrastructure/api/` |
| Frontend Routes | `apps/frontend/src/routes/` |
