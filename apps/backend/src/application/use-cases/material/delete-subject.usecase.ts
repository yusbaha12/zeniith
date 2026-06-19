/*
Tujuan: Menyediakan use case fase 7 untuk menghapus mata pelajaran.
Caller: Superadmin curriculum controller.
Dependensi: Module repository.
Main Functions: Menghapus data mata pelajaran dari database dengan penanganan constraint.
Side Effects: Menghapus data di database PostgreSQL.
*/

import type { IModuleRepository } from '../../../domain/repositories/module.repository'

export class DeleteSubjectUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(id: string): Promise<void> {
    try {
      await this.moduleRepository.deleteSubject(id)
    } catch (error: any) {
      if (error?.message?.includes('foreign key') || error?.code === '23503') {
        throw new Error('Mata pelajaran tidak dapat dihapus karena memiliki modul atau materi aktif. Silakan nonaktifkan saja.')
      }
      throw error
    }
  }
}
