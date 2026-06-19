/*
Tujuan: Mendefinisikan schema tabel settings untuk konfigurasi sistem operasional fase 7.
Caller: Drizzle Kit dan admin repository.
Dependensi: drizzle-orm/pg-core.
Main Functions: Menyimpan data key-value pengaturan sistem global.
Side Effects: Menjadi sumber migration database untuk settings.
*/

import { jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const settings = pgTable('settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull().default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
