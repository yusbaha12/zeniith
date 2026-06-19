/*
Tujuan: Menyediakan use case fase 7 untuk memperbarui konfigurasi pengaturan operasional sistem.
Caller: Super admin controller.
Dependensi: Admin repository.
Main Functions: Menyimpan settings key-value ke database.
Side Effects: Menulis database PostgreSQL.
*/

import type { IAdminRepository } from '../../../domain/repositories/admin.repository'

export interface UpdateSystemSettingsInput {
  key: string
  value: Record<string, unknown>
}

export class UpdateSystemSettingsUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(input: UpdateSystemSettingsInput): Promise<{ success: boolean }> {
    await this.adminRepository.saveSetting(input.key, input.value)
    return { success: true }
  }
}
