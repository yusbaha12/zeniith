/*
Tujuan: Mengonversi row database branch menjadi entitas domain branch.
Caller: Branch repository implementation.
Dependensi: BranchEntity dan schema branches.
Main Functions: Menjaga translasi row DB ke domain tetap terpusat.
Side Effects: Tidak ada; mapper murni.
*/

import { BranchEntity } from '../../domain/entities/branch.entity'
import type { branches } from '../database/schema'

type BranchRow = typeof branches.$inferSelect

export class BranchMapper {
  static toDomain(row: BranchRow): BranchEntity {
    return new BranchEntity(
      row.id,
      row.name,
      row.code,
      row.address ?? null,
      row.city ?? null,
      row.phone ?? null,
      row.isActive
    )
  }
}
