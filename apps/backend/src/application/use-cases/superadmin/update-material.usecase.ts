/*
Tujuan: Menyediakan use case update materi global untuk Superadmin.
Caller: SuperAdminController endpoint `PATCH /api/superadmin/materials/:id`.
Dependensi: DB transaction, material repository, material service, dan object storage.
Main Functions: Memperbarui metadata/konten materi lintas pemilik dengan upload attachment opsional.
Side Effects: Membaca/menulis tabel materials dan dapat upload object ke MinIO/S3.
*/

import type { MaterialType } from '@lms-bimbel/shared'

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import { NotFoundError } from '../../../shared/errors/app.error'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'
import { MaterialService } from '../../services/material.service'

interface SuperadminUpdateMaterialInput {
  materialId: string
  title: string
  summary: string | null
  materialType: MaterialType
  contentJson: Record<string, unknown> | null
  estimatedDurationMinutes: number | null
  sortOrder: number
  isPublished: boolean
  attachmentFile?: File | null
}

export class SuperadminUpdateMaterialUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly materialRepository: IMaterialRepository,
    private readonly materialService: MaterialService,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(input: SuperadminUpdateMaterialInput) {
    const currentMaterial = await this.materialRepository.findById(input.materialId)

    if (!currentMaterial) {
      throw new NotFoundError('Materi belajar')
    }

    this.materialService.validateAttachment(input.attachmentFile, input.materialType)
    const slug = this.materialService.createSlug(input.title)

    let attachmentObjectKey = currentMaterial.attachmentObjectKey
    let attachmentFileName = currentMaterial.attachmentFileName
    let attachmentContentType = currentMaterial.attachmentContentType

    if (input.attachmentFile) {
      attachmentObjectKey = this.materialService.buildAttachmentObjectKey(input.materialType, slug, input.attachmentFile.name)
      await this.objectStorageService.uploadObject(attachmentObjectKey, input.attachmentFile)
      attachmentFileName = input.attachmentFile.name
      attachmentContentType = input.attachmentFile.type
    }

    const material = await this.database.transaction(async (transaction) =>
      this.materialRepository.update(input.materialId, {
        title: input.title,
        slug,
        summary: input.summary,
        materialType: input.materialType,
        contentJson: input.contentJson,
        attachmentObjectKey,
        attachmentFileName,
        attachmentContentType,
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        sortOrder: input.sortOrder,
        isPublished: input.isPublished
      }, transaction)
    )

    return material.toSummary()
  }
}
