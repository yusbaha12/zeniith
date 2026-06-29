/*
Tujuan: Menyediakan use case detail materi guru fase 3 untuk halaman edit dengan kontrol PIC guru.
Caller: Teacher material controller.
Dependensi: IMaterialRepository, IModuleRepository, MaterialService, dan ObjectStorageService.
Main Functions: Mengambil detail materi guru, memastikan kepemilikan dan akses PIC, lalu menyegarkan signed URL gambar dalam content JSON.
Side Effects: Membaca tabel materials dan membuat signed URL image/attachment dari MinIO/S3.
*/

import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error'
import type { IMaterialRepository } from '../../../domain/repositories/material.repository'
import type { IModuleRepository } from '../../../domain/repositories/module.repository'
import { MaterialService } from '../../services/material.service'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'

export class GetTeacherMaterialDetailUseCase {
  constructor(
    private readonly materialRepository: IMaterialRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly materialService: MaterialService,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(materialId: string, teacherId: string) {
    const material = await this.materialRepository.findById(materialId)

    if (!material) {
      throw new NotFoundError('Materi belajar')
    }

    if (material.createdBy !== teacherId) {
      throw new ForbiddenError('Materi ini bukan milik Anda')
    }

    const teacherListItem = await this.materialRepository.findTeacherListItemById(materialId)

    if (!teacherListItem) {
      throw new NotFoundError('Materi belajar')
    }

    const canAccessSubject = await this.moduleRepository.teacherCanAccessSubject(teacherListItem.subjectId, teacherId)

    if (!canAccessSubject) {
      throw new ForbiddenError('Anda bukan PIC guru untuk mata pelajaran ini')
    }

    return {
      ...teacherListItem,
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
