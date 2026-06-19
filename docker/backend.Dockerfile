# Tujuan: Build image backend Bun + ElysiaJS untuk fase 0.
# Caller: Docker build backend lokal/CI.
# Dependensi: Root package.json, apps/backend, packages/shared.
# Main Functions: Menginstal dependency workspace lalu build backend ke mode production ringan.
# Side Effects: Menghasilkan image container backend dengan output build Bun.

FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN bun install

COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./tsconfig.base.json

RUN cd apps/backend && bun run build

EXPOSE 3000

CMD ["bun", "run", "apps/backend/dist/index.js"]
