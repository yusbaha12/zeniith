/*
Tujuan: Merepresentasikan entitas materi belajar fase 3 untuk student dan teacher.
Caller: Material repository, use case ruang belajar, dan teacher CRUD materi.
Dependensi: MaterialType shared.
Main Functions: Menyimpan metadata materi dan helper status publish/attachment.
Side Effects: Tidak ada; entitas domain murni.
*/

import type { MaterialType } from '@lms-bimbel/shared'

export interface MaterialSummary {
  id: string
  moduleId: string
  title: string
  slug: string
  summary: string | null
  materialType: MaterialType
  estimatedDurationMinutes: number | null
  sortOrder: number
  isPublished: boolean
}

export class MaterialEntity {
  constructor(
    public readonly id: string,
    public readonly moduleId: string,
    public readonly branchId: string | null,
    public readonly createdBy: string | null,
    public readonly title: string,
    public readonly slug: string,
    public readonly summary: string | null,
    public readonly materialType: MaterialType,
    public readonly contentJson: Record<string, unknown> | null,
    public readonly attachmentObjectKey: string | null,
    public readonly attachmentFileName: string | null,
    public readonly attachmentContentType: string | null,
    public readonly estimatedDurationMinutes: number | null,
    public readonly sortOrder: number,
    public readonly isPublished: boolean
  ) {}

  isReadable(): boolean {
    return this.isPublished
  }

  hasAttachment(): boolean {
    return !!this.attachmentObjectKey
  }

  toSummary(): MaterialSummary {
    return {
      id: this.id,
      moduleId: this.moduleId,
      title: this.title,
      slug: this.slug,
      summary: this.summary,
      materialType: this.materialType,
      estimatedDurationMinutes: this.estimatedDurationMinutes,
      sortOrder: this.sortOrder,
      isPublished: this.isPublished
    }
  }
}
