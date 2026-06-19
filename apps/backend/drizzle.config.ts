/*
Tujuan: Konfigurasi Drizzle Kit untuk generate dan migrate schema PostgreSQL fase 0.
Caller: Script `db:generate`, `db:migrate`, dan `db:push` backend.
Dependensi: drizzle-kit, DATABASE_URL, folder schema infrastructure.
Main Functions: Menentukan lokasi schema, output migration, dan kredensial DB.
Side Effects: Mengarahkan file migration dan koneksi saat operasi database tooling dijalankan.
*/

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/database/schema/*.ts',
  out: './src/infrastructure/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://lms_user:lms_password@localhost:5432/lms_bimbel'
  }
})
