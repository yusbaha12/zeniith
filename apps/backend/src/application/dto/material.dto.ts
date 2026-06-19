/*
Tujuan: Menyediakan DTO validasi request fase 3 untuk subject, module, material, dan progress.
Caller: Material controller student dan teacher.
Dependensi: Elysia validator `t` dan enum material type shared.
Main Functions: Memvalidasi params/query/body JSON maupun multipart untuk ruang belajar.
Side Effects: Tidak ada; hanya schema validasi runtime.
*/

import { t } from 'elysia'

export const SubjectIdParamsDto = t.Object({
  id: t.String({ format: 'uuid' })
})

export const ModuleIdParamsDto = t.Object({
  id: t.String({ format: 'uuid' })
})

export const MaterialIdParamsDto = t.Object({
  id: t.String({ format: 'uuid' })
})

export const MaterialTypeDto = t.Union([
  t.Literal('VIDEO'),
  t.Literal('PDF'),
  t.Literal('EXERCISE'),
  t.Literal('TEXT')
])

export const TrackMaterialProgressDto = t.Object({
  progressPercent: t.Numeric({ minimum: 0, maximum: 100 }),
  isCompleted: t.Boolean()
})

export const TeacherMaterialsQueryDto = t.Object({
  moduleId: t.Optional(t.String({ format: 'uuid' }))
})

export const SaveMaterialDto = t.Object({
  moduleId: t.String({ format: 'uuid' }),
  title: t.String({ minLength: 3, maxLength: 180 }),
  summary: t.Optional(t.String({ maxLength: 500 })),
  materialType: MaterialTypeDto,
  contentJson: t.Optional(t.Union([t.String(), t.Record(t.String(), t.Any())])),
  estimatedDurationMinutes: t.Optional(t.Numeric({ minimum: 1, maximum: 600 })),
  sortOrder: t.Optional(t.Numeric({ minimum: 0, maximum: 9999 })),
  isPublished: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
  attachmentFile: t.Optional(t.File())
})

export const UpdateMaterialDto = t.Object({
  title: t.String({ minLength: 3, maxLength: 180 }),
  summary: t.Optional(t.String({ maxLength: 500 })),
  materialType: MaterialTypeDto,
  contentJson: t.Optional(t.Union([t.String(), t.Record(t.String(), t.Any())])),
  estimatedDurationMinutes: t.Optional(t.Numeric({ minimum: 1, maximum: 600 })),
  sortOrder: t.Optional(t.Numeric({ minimum: 0, maximum: 9999 })),
  isPublished: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
  attachmentFile: t.Optional(t.File())
})

export const UploadMaterialImageDto = t.Object({
  file: t.File()
})
