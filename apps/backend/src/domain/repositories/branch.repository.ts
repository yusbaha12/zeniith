/*
Tujuan: Mendefinisikan kontrak repository cabang untuk use case fase auth/register.
Caller: Branch use case dan register use case.
Dependensi: BranchEntity domain.
Main Functions: Menyediakan operasi baca branch aktif dan pencarian berdasarkan id.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { BranchEntity } from '../entities/branch.entity'

export interface IBranchRepository {
  findById(id: string): Promise<BranchEntity | null>
  findActive(): Promise<BranchEntity[]>
  listAll(): Promise<BranchEntity[]>
  create(input: {
    name: string
    code: string
    address: string | null
    city: string | null
    phone: string | null
    isActive: boolean
  }): Promise<BranchEntity>
  update(
    id: string,
    input: Partial<{
      name: string
      code: string
      address: string | null
      city: string | null
      phone: string | null
      isActive: boolean
    }>
  ): Promise<BranchEntity>
  delete(id: string): Promise<void>
}
