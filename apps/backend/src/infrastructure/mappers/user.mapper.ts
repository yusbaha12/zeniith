/*
Tujuan: Mengonversi row database user menjadi entitas domain user.
Caller: User repository implementation dan middleware auth.
Dependensi: UserEntity dan schema users.
Main Functions: Menjaga translasi row DB ke domain tetap konsisten.
Side Effects: Tidak ada; mapper murni.
*/

import { UserEntity } from '../../domain/entities/user.entity'
import type { users } from '../database/schema'

type UserRow = typeof users.$inferSelect

export class UserMapper {
  static toDomain(row: UserRow): UserEntity {
    return new UserEntity(
      row.id,
      row.branchId ?? null,
      row.name,
      row.email,
      row.passwordHash,
      row.phone ?? null,
      row.role,
      row.avatarUrl ?? null,
      row.isActive,
      row.createdAt ?? undefined
    )
  }
}
