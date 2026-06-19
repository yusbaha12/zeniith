<!--
Tujuan: Mendokumentasikan sequence diagram fase 0 agar alur bootstrap dan health check mudah dipindai tim.
Caller: Developer, reviewer, dan sesi implementasi lanjutan.
Dependensi: Struktur scaffold fase 0 pada backend, frontend, Docker, dan shared package.
Main Functions: Menjelaskan urutan start infrastruktur, bootstrap backend/frontend, dan request health endpoint.
Side Effects: Dokumentasi saja; tidak ada efek runtime.
-->

# Sequence Diagram Fase 0

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Docker as Docker Compose
    participant Infra as Postgres/Redis/MinIO
    participant Frontend as SvelteKit Frontend
    participant Backend as ElysiaJS Backend
    participant Shared as Shared Package

    Dev->>Docker: docker compose up -d
    Docker->>Infra: start postgres, redis, minio
    Dev->>Shared: bun install workspace dependencies
    Dev->>Backend: bun run dev
    Backend->>Backend: loadConfig()
    Backend->>Backend: register cors, jwt, bearer, swagger
    Dev->>Frontend: bun run dev
    Frontend->>Shared: consume shared types/constants
    Dev->>Backend: GET /health
    Backend-->>Dev: { status: "ok", app, environment, timestamp }
    Dev->>Backend: GET /docs
    Backend-->>Dev: Swagger UI fase 0
```
