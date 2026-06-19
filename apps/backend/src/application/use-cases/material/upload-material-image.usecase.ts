/*
Tujuan: Menyediakan use case upload image asset untuk editor materi guru fase 3.
Caller: Teacher material controller.
Dependensi: MaterialService dan ObjectStorageService.
Main Functions: Memvalidasi file image, mengunggah ke storage, lalu mengembalikan object key dan signed URL.
Side Effects: Mengunggah object gambar ke MinIO/S3.
*/

import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'
import { MaterialService } from '../../services/material.service'

export class UploadMaterialImageUseCase {
  constructor(
    private readonly materialService: MaterialService,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(file: File) {
    this.materialService.validateImage(file)
    const objectKey = this.materialService.buildAttachmentObjectKey('TEXT', `editor-image-${Date.now()}`, file.name)
    await this.objectStorageService.uploadObject(objectKey, file)

    return {
      objectKey,
      url: await this.objectStorageService.createSignedPreviewUrl(objectKey)
    }
  }
}
