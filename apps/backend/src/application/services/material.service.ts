/*
Tujuan: Menyediakan logika materi fase 3 untuk slug, validasi aset, dan normalisasi konten editor.
Caller: Use case student materials dan teacher CRUD materi.
Dependensi: AppConfig untuk aturan upload aset material.
Main Functions: Membuat slug aman, memvalidasi attachment/image asset, dan menyegarkan signed URL node gambar berbasis object key.
Side Effects: Tidak ada write langsung; service logika murni.
*/

import type { MaterialType } from '@lms-bimbel/shared'

import type { AppConfig } from './config.service'
import { AppError } from '../../shared/errors/app.error'
import { ObjectStorageService } from '../../infrastructure/storage/object-storage.service'

export class MaterialService {
  constructor(
    private readonly config: AppConfig,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  createSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180)
  }

  validateAttachment(file: File | null | undefined, materialType: MaterialType): void {
    if (!file) {
      return
    }

    if (file.size > this.config.maxUploadSizeMb * 1024 * 1024) {
      throw new AppError(`Ukuran file materi maksimal ${this.config.maxUploadSizeMb} MB`, 422, 'MATERIAL_FILE_TOO_LARGE')
    }

    if (!this.config.allowedMaterialAssetTypes.includes(file.type)) {
      throw new AppError('Format file materi tidak didukung', 422, 'MATERIAL_FILE_INVALID_TYPE')
    }

    if (materialType === 'VIDEO' && !file.type.startsWith('video/')) {
      throw new AppError('Materi video harus memakai file video', 422, 'MATERIAL_VIDEO_FILE_REQUIRED')
    }

    if (materialType === 'PDF' && file.type !== 'application/pdf') {
      throw new AppError('Materi PDF harus memakai file PDF', 422, 'MATERIAL_PDF_FILE_REQUIRED')
    }
  }

  validateImage(file: File): void {
    if (!file.type.startsWith('image/')) {
      throw new AppError('Aset gambar harus berupa file image', 422, 'MATERIAL_IMAGE_INVALID_TYPE')
    }

    if (file.size > this.config.maxUploadSizeMb * 1024 * 1024) {
      throw new AppError(`Ukuran gambar maksimal ${this.config.maxUploadSizeMb} MB`, 422, 'MATERIAL_IMAGE_TOO_LARGE')
    }
  }

  buildAttachmentObjectKey(materialType: MaterialType, slug: string, fileName: string): string {
    const safeFileName = fileName.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-')
    return `materials/${materialType.toLowerCase()}/${slug}/${Date.now()}-${safeFileName}`
  }

  async refreshContentAssetUrls(contentJson: Record<string, unknown> | null): Promise<Record<string, unknown> | null> {
    if (!contentJson) {
      return null
    }

    return this.walkNode(contentJson)
  }

  private async walkNode(node: Record<string, unknown>): Promise<Record<string, unknown>> {
    const clonedNode: Record<string, unknown> = { ...node }

    if (clonedNode.type === 'image' && clonedNode.attrs && typeof clonedNode.attrs === 'object') {
      const attrs = { ...(clonedNode.attrs as Record<string, unknown>) }
      const objectKey = typeof attrs.uploadKey === 'string' ? attrs.uploadKey : null

      if (objectKey) {
        attrs.src = await this.objectStorageService.createSignedPreviewUrl(objectKey)
      }

      clonedNode.attrs = attrs
    }

    if (Array.isArray(clonedNode.content)) {
      clonedNode.content = await Promise.all(
        clonedNode.content.map(async (child) => {
          if (child && typeof child === 'object') {
            return this.walkNode(child as Record<string, unknown>)
          }

          return child
        })
      )
    }

    return clonedNode
  }
}
