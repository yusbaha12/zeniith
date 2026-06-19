/*
Tujuan: Menyediakan use case daftar materi guru fase 3 untuk dashboard teacher.
Caller: Teacher material controller.
Dependensi: IMaterialRepository dan IModuleRepository.
Main Functions: Mengambil daftar materi milik guru lalu memfilter per module bila dibutuhkan.
Side Effects: Membaca tabel materials/modules/subjects melalui repository.
*/

import type { IMaterialRepository } from '../../../domain/repositories/material.repository'

export class ListTeacherMaterialsUseCase {
  constructor(private readonly materialRepository: IMaterialRepository) {}

  async execute(teacherId: string, branchId: string | null, moduleId?: string) {
    const materials = await this.materialRepository.listByTeacher(teacherId, branchId)

    if (!moduleId) {
      return materials
    }

    return materials.filter((item) => item.moduleId === moduleId)
  }
}
