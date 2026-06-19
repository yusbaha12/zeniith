# Tujuan: Build image frontend SvelteKit fase 0.
# Caller: Docker build frontend lokal/CI.
# Dependensi: Root package.json, apps/frontend, packages/shared.
# Main Functions: Menginstal dependency workspace dan membangun frontend SvelteKit.
# Side Effects: Menghasilkan image container frontend untuk preview/build production.

FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN bun install

COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./tsconfig.base.json

RUN cd apps/frontend && bun run build

EXPOSE 3000

CMD ["bun", "run", "apps/frontend/build/index.js"]
