/*
Tujuan: Menyediakan use case create materi guru/admin fase 3/7 dengan upload attachment opsional dan kontrol PIC guru.
Caller: Teacher material controller dan SuperAdmin material controller.
Dependensi: DB transaction, module repository, material repository, material service, dan object storage.
Main Functions: Memvalidasi modul, akses PIC guru, attachment, upload file bila ada, lalu menyimpan materi baru secara atomik.
Side Effects: Membaca tabel modules, menulis tabel materials, dan dapat upload object ke MinIO/S3.
*/

import type { MaterialType } from '@lms-bimbel/shared'

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import type { IModuleRepository } from '../../../domain/repositories/module.repository'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'
import { MaterialService } from '../../services/material.service'

interface CreateMaterialInput {
  teacherId: string
  branchId: string | null
  moduleId: string
  title: string
  summary: string | null
  materialType: MaterialType
  contentJson: Record<string, unknown> | null
  estimatedDurationMinutes: number | null
  sortOrder: number
  isPublished: boolean
  attachmentFile?: File | null
  enforceTeacherPic?: boolean
}

export class CreateMaterialUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly moduleRepository: IModuleRepository,
    private readonly materialRepository: IMaterialRepository,
    private readonly materialService: MaterialService,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(input: CreateMaterialInput) {
    const moduleItem = await this.moduleRepository.findModuleById(input.moduleId)

    if (!moduleItem) {
      throw new NotFoundError('Modul belajar')
    }

    if (input.enforceTeacherPic !== false) {
      const canAccessSubject = await this.moduleRepository.teacherCanAccessSubject(moduleItem.subjectId, input.teacherId)

      if (!canAccessSubject) {
        throw new ForbiddenError('Anda bukan PIC guru untuk mata pelajaran ini')
      }
    }

    this.materialService.validateAttachment(input.attachmentFile, input.materialType)
    const slug = this.materialService.createSlug(input.title)

    let attachmentObjectKey: string | null = null

    if (input.attachmentFile) {
      attachmentObjectKey = this.materialService.buildAttachmentObjectKey(input.materialType, slug, input.attachmentFile.name)
      await this.objectStorageService.uploadObject(attachmentObjectKey, input.attachmentFile)
    }

    const material = await this.database.transaction(async (transaction) =>
      this.materialRepository.create({
        moduleId: input.moduleId,
        branchId: input.branchId,
        createdBy: input.teacherId,
        title: input.title,
        slug,
        summary: input.summary,
        materialType: input.materialType,
        contentJson: input.contentJson,
        attachmentObjectKey,
        attachmentFileName: input.attachmentFile?.name ?? null,
        attachmentContentType: input.attachmentFile?.type ?? null,
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        sortOrder: input.sortOrder,
        isPublished: input.isPublished
      }, transaction)
    )

    return material.toSummary()
  }
}
