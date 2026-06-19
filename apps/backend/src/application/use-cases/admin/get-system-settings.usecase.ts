/*
Tujuan: Menyediakan use case fase 7 untuk membaca konfigurasi pengaturan operasional sistem.
Caller: Super admin controller.
Dependensi: Admin repository.
Main Functions: Membaca settings berdasarkan key dengan fallback nilai default.
Side Effects: Membaca database PostgreSQL.
*/

import type { IAdminRepository } from '../../../domain/repositories/admin.repository'

export class GetSystemSettingsUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(key: string): Promise<Record<string, unknown>> {
    const value = await this.adminRepository.getSetting(key)
    
    if (value) {
      return value
    }

    // Default Fallbacks
    if (key === 'system_config') {
      return {
        maintenanceMode: false,
        registrationOpen: true,
        maxWarningsAllowed: 5,
        paymentAutoVerify: false
      }
    }

    return {}
  }
}
