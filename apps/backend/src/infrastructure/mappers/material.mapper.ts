/*
Tujuan: Memetakan row tabel materials menjadi MaterialEntity domain fase 3.
Caller: Material repository Drizzle.
Dependensi: MaterialEntity.
Main Functions: Menjaga transformasi DB ke domain tetap terpusat dan konsisten.
Side Effects: Tidak ada; mapper murni.
*/

import type { materials } from '../database/schema'
import { MaterialEntity } from '../../domain/entities/material.entity'

type MaterialRow = typeof materials.$inferSelect

export class MaterialMapper {
  static toDomain(row: MaterialRow): MaterialEntity {
    return new MaterialEntity(
      row.id,
      row.moduleId,
      row.branchId,
      row.createdBy,
      row.title,
      row.slug,
      row.summary,
      row.materialType,
      (row.contentJson as Record<string, unknown> | null) ?? null,
      row.attachmentObjectKey,
      row.attachmentFileName,
      row.attachmentContentType,
      row.estimatedDurationMinutes,
      row.sortOrder,
      row.isPublished
    )
  }
}
