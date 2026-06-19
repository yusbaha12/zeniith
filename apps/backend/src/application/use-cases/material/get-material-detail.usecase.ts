/*
Tujuan: Menyediakan use case detail materi fase 3 untuk murid dengan refresh signed URL aset.
Caller: Material controller student.
Dependensi: IMaterialRepository, MaterialService, dan ObjectStorageService.
Main Functions: Mengambil satu materi published, menyegarkan asset URL, dan mengembalikan detail aman.
Side Effects: Membaca tabel materials serta membuat signed URL attachment/image dari MinIO/S3.
*/

import { NotFoundError } from '../../../shared/errors/app.error'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'
import { MaterialService } from '../../services/material.service'

export class GetMaterialDetailUseCase {
  constructor(
    private readonly materialRepository: IMaterialRepository,
    private readonly materialService: MaterialService,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(materialId: string) {
    const material = await this.materialRepository.findById(materialId)

    if (!material || !material.isReadable()) {
      throw new NotFoundError('Materi belajar')
    }

    return {
      ...material.toSummary(),
      contentJson: await this.materialService.refreshContentAssetUrls(material.contentJson),
      attachmentUrl: material.attachmentObjectKey
        ? await this.objectStorageService.createSignedPreviewUrl(material.attachmentObjectKey)
        : null,
      attachmentFileName: material.attachmentFileName,
      attachmentContentType: material.attachmentContentType
    }
  }
}
