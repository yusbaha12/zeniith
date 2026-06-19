/*
Tujuan: Memetakan row tabel modules menjadi ModuleEntity domain fase 3.
Caller: Module repository Drizzle.
Dependensi: ModuleEntity.
Main Functions: Menjaga transformasi DB ke domain tetap terpusat dan konsisten.
Side Effects: Tidak ada; mapper murni.
*/

import type { modules } from '../database/schema'
import { ModuleEntity } from '../../domain/entities/module.entity'

type ModuleRow = typeof modules.$inferSelect

export class ModuleMapper {
  static toDomain(row: ModuleRow): ModuleEntity {
    return new ModuleEntity(
      row.id,
      row.subjectId,
      row.title,
      row.slug,
      row.description,
      row.sortOrder,
      row.isActive
    )
  }
}
