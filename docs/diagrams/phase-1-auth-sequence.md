<!--
Tujuan: Mendokumentasikan sequence diagram fase 1 untuk alur login, sesi cookie, dan akses profil.
Caller: Developer, reviewer, dan sesi implementasi lanjutan auth/user.
Dependensi: Backend auth controller, auth middleware, frontend login, dan role guard server-side.
Main Functions: Menjelaskan urutan login sampai protected route dapat diakses berdasarkan role.
Side Effects: Dokumentasi saja; tidak ada efek runtime.
-->

# Sequence Diagram Fase 1

```mermaid
sequenceDiagram
    participant User as Pengguna
    participant Frontend as SvelteKit Frontend
    participant Backend as ElysiaJS Backend
    participant UseCase as Login/Register/Profile UseCase
    participant Repo as User/Branch Repository
    participant DB as PostgreSQL

    User->>Frontend: Isi form login / daftar
    Frontend->>Backend: POST /api/auth/login atau /api/auth/register
    Backend->>UseCase: Validasi payload + bisnis auth
    UseCase->>Repo: findByEmail / create / findById
    Repo->>DB: Query user dan branch
    DB-->>Repo: Hasil query
    Repo-->>UseCase: Entitas user / branch
    UseCase-->>Backend: access token, refresh token, safe profile
    Backend-->>Frontend: Response JSON + httpOnly cookies
    Frontend->>Backend: GET /api/me dengan cookie sesi
    Backend->>UseCase: Auth middleware + get profile
    UseCase->>Repo: findById
    Repo->>DB: Query user by id
    DB-->>Repo: Row user
    Repo-->>UseCase: User entity
    Backend-->>Frontend: Profil user aktif
    Frontend-->>User: Redirect ke dashboard sesuai role
```
