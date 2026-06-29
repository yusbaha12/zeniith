/*
Tujuan: Menyediakan use case detail materi global untuk Superadmin.
Caller: SuperAdminController endpoint `/api/superadmin/materials/:id`.
Dependensi: IMaterialRepository, MaterialService, dan ObjectStorageService.
Main Functions: Mengambil detail materi tanpa batas kepemilikan lalu menyegarkan signed URL konten/attachment.
Side Effects: Membaca tabel materials dan membuat signed URL image/attachment dari MinIO/S3.
*/

import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'
import { NotFoundError } from '../../../shared/errors/app.error'
import { MaterialService } from '../../services/material.service'

export class SuperadminGetMaterialDetailUseCase {
  constructor(
    private readonly materialRepository: IMaterialRepository,
    private readonly materialService: MaterialService,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(materialId: string) {
    const material = await this.materialRepository.findById(materialId)

    if (!material) {
      throw new NotFoundError('Materi belajar')
    }

    const materialListItem = await this.materialRepository.findTeacherListItemById(materialId)

    if (!materialListItem) {
      throw new NotFoundError('Materi belajar')
    }

    return {
      ...materialListItem,
      contentJson: await this.materialService.refreshContentAssetUrls(material.contentJson),
      attachmentUrl: material.attachmentObjectKey
        ? await this.objectStorageService.createSignedPreviewUrl(material.attachmentObjectKey)
        : null,
      attachmentFileName: material.attachmentFileName,
      attachmentContentType: material.attachmentContentType,
      estimatedDurationMinutes: material.estimatedDurationMinutes
    }
  }
}
