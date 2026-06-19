/*
Tujuan: Menyediakan use case fase 7 untuk menghapus modul.
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Menghapus data modul dari database dengan penanganan constraint.
Side Effects: Menghapus data di database PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export class DeleteModuleUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(id: string): Promise<void> {
    try {
      await this.moduleRepository.deleteModule(id)
    } catch (error: any) {
      if (error?.message?.includes('foreign key') || error?.code === '23503') {
        throw new Error('Modul tidak dapat dihapus karena memiliki materi aktif. Silakan nonaktifkan saja.')
      }
      throw error
    }
  }
}
