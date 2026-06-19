/*
Tujuan: Menyediakan koneksi PostgreSQL via postgres.js + Drizzle untuk backend fase 1.
Caller: Container backend, repository, use case yang memerlukan transaksi, dan seeder.
Dependensi: postgres, drizzle-orm/postgres-js, config service, schema database.
Main Functions: Membuat client SQL singleton dan instance Drizzle typed untuk query/transaksi.
Side Effects: Membuka pool koneksi PostgreSQL saat modul dipakai.
*/

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { loadConfig } from '../../application/services/config.service'
import * as schema from './schema'

const config = loadConfig()

// Primary connection for Write
export const sql = postgres(config.databaseUrl, {
  max: 20
})

export const db = drizzle(sql, {
  schema
})

// Replica connection for Read
export const sqlReplica = postgres(config.databaseReplicaUrl, {
  max: 20
})

export const dbReplica = drizzle(sqlReplica, {
  schema
})

export type AppDatabase = typeof db
