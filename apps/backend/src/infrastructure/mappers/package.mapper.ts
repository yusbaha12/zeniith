/*
Tujuan: Memetakan row tabel packages menjadi PackageEntity domain fase 2.
Caller: Package repository Drizzle.
Dependensi: PackageEntity dan MoneyVO.
Main Functions: Menjaga transformasi DB ke domain tetap terpusat dan konsisten.
Side Effects: Tidak ada; mapper murni.
*/

import type { packages } from '../database/schema'
import { PackageEntity } from '../../domain/entities/package.entity'
import { MoneyVO } from '../../domain/value-objects/money.vo'

type PackageRow = typeof packages.$inferSelect

export class PackageMapper {
  static toDomain(row: PackageRow): PackageEntity {
    return new PackageEntity(
      row.id,
      row.slug,
      row.name,
      row.description,
      row.type,
      MoneyVO.create(row.price),
      row.durationDays,
      row.isActive,
      row.sortOrder
    )
  }
}
