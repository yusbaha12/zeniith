/*
Tujuan: Menyediakan use case update materi guru fase 3 dengan refresh attachment opsional dan kontrol PIC guru.
Caller: Teacher material controller.
Dependensi: DB transaction, material repository, module repository, material service, dan object storage.
Main Functions: Memastikan kepemilikan materi dan akses PIC, upload lampiran baru bila ada, lalu memperbarui record materi.
Side Effects: Membaca/menulis tabel materials dan dapat upload object ke MinIO/S3.
*/

import type { MaterialType } from '@lms-bimbel/shared'

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import type { IModuleRepository } from '../../../domain/repositories/module.repository'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'
import { MaterialService } from '../../services/material.service'

interface UpdateMaterialInput {
  materialId: string
  teacherId: string
  title: string
  summary: string | null
  materialType: MaterialType
  contentJson: Record<string, unknown> | null
  estimatedDurationMinutes: number | null
  sortOrder: number
  isPublished: boolean
  attachmentFile?: File | null
}

export class UpdateMaterialUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly materialRepository: IMaterialRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly materialService: MaterialService,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(input: UpdateMaterialInput) {
    const currentMaterial = await this.materialRepository.findById(input.materialId)

    if (!currentMaterial) {
      throw new NotFoundError('Materi belajar')
    }

    if (currentMaterial.createdBy !== input.teacherId) {
      throw new ForbiddenError('Materi ini bukan milik Anda')
    }

    const moduleItem = await this.moduleRepository.findModuleById(currentMaterial.moduleId)

    if (!moduleItem) {
      throw new NotFoundError('Modul belajar')
    }

    const canAccessSubject = await this.moduleRepository.teacherCanAccessSubject(moduleItem.subjectId, input.teacherId)

    if (!canAccessSubject) {
      throw new ForbiddenError('Anda bukan PIC guru untuk mata pelajaran ini')
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
