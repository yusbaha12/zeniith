/*
Tujuan: Menyediakan use case daftar materi global untuk Superadmin.
Caller: SuperAdminController endpoint `/api/superadmin/materials`.
Dependensi: IMaterialRepository.
Main Functions: Mengambil materi lintas guru/cabang dengan filter module, subject, dan status publish.
Side Effects: Membaca tabel materials/modules/subjects melalui repository.
*/

import type { IMaterialRepository } from '../../../domain/repositories/material.repository'

interface SuperadminMaterialFilters {
  moduleId?: string
  subjectId?: string
  isPublished?: boolean
  searchQuery?: string
}

export class SuperadminListMaterialsUseCase {
  constructor(private readonly materialRepository: IMaterialRepository) {}

  async execute(filters: SuperadminMaterialFilters = {}) {
    return this.materialRepository.listAllForAdmin(filters)
  }
}
