/*
Tujuan: Menyediakan DTO validasi Superadmin untuk cabang, pengguna, paket, kurikulum, assignment PIC guru, dan settings.
Caller: SuperAdminController.
Dependensi: Elysia validator `t`.
Main Functions: Memvalidasi payload CRUD administrasi global sebelum masuk use case.
Side Effects: Tidak ada; hanya schema validasi runtime.
*/

import { t } from 'elysia'

// Branch CRUD DTOs
export const CreateBranchDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  code: t.String({ minLength: 2, maxLength: 20 }),
  address: t.Optional(t.String()),
  city: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean())
})

export const UpdateBranchDto = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  code: t.Optional(t.String({ minLength: 2, maxLength: 20 })),
  address: t.Optional(t.String()),
  city: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean())
})

// User CRUD DTOs
export const CreateUserDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
  phone: t.Optional(t.String()),
  role: t.Union([
    t.Literal('SUPER_ADMIN'),
    t.Literal('BRANCH_ADMIN'),
    t.Literal('TEACHER'),
    t.Literal('STUDENT')
  ]),
  branchId: t.Optional(t.String({ format: 'uuid' })),
  isActive: t.Optional(t.Boolean())
})

export const UpdateUserDto = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  email: t.Optional(t.String({ format: 'email' })),
  phone: t.Optional(t.String()),
  role: t.Optional(
    t.Union([
      t.Literal('SUPER_ADMIN'),
      t.Literal('BRANCH_ADMIN'),
      t.Literal('TEACHER'),
      t.Literal('STUDENT')
    ])
  ),
  branchId: t.Optional(t.String({ format: 'uuid' })),
  isActive: t.Optional(t.Boolean())
})

// Package CRUD DTOs
export const CreatePackageDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 120 }),
  type: t.Union([t.Literal('REGULER'), t.Literal('INTENSIF'), t.Literal('PREMIUM')]),
  description: t.Optional(t.String()),
  price: t.Number({ minimum: 0 }),
  durationDays: t.Number({ minimum: 1 }),
  isActive: t.Optional(t.Boolean()),
  sortOrder: t.Optional(t.Number())
})

export const UpdatePackageDto = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
  type: t.Optional(t.Union([t.Literal('REGULER'), t.Literal('INTENSIF'), t.Literal('PREMIUM')])),
  description: t.Optional(t.String()),
  price: t.Optional(t.Number({ minimum: 0 })),
  durationDays: t.Optional(t.Number({ minimum: 1 })),
  isActive: t.Optional(t.Boolean()),
  sortOrder: t.Optional(t.Number())
})

// Package Feature CRUD DTOs
export const CreatePackageFeatureDto = t.Object({
  title: t.String({ minLength: 2, maxLength: 160 }),
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number())
})

export const UpdatePackageFeatureDto = t.Object({
  title: t.Optional(t.String({ minLength: 2, maxLength: 160 })),
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number())
})

// Package Curriculum Mapping DTO
export const AssignPackageSubjectsDto = t.Object({
  subjectIds: t.Array(t.String({ format: 'uuid' }))
})


// Curriculum Subject CRUD DTOs
export const CreateSubjectDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 120 }),
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
  isActive: t.Optional(t.Boolean()),
  teacherIds: t.Optional(t.Array(t.String({ format: 'uuid' })))
})

export const UpdateSubjectDto = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
  isActive: t.Optional(t.Boolean()),
  teacherIds: t.Optional(t.Array(t.String({ format: 'uuid' })))
})

// Curriculum Module CRUD DTOs
export const CreateModuleDto = t.Object({
  subjectId: t.String({ format: 'uuid' }),
  title: t.String({ minLength: 2, maxLength: 160 }),
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
  isActive: t.Optional(t.Boolean())
})

export const UpdateModuleDto = t.Object({
  subjectId: t.Optional(t.String({ format: 'uuid' })),
  title: t.Optional(t.String({ minLength: 2, maxLength: 160 })),
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
  isActive: t.Optional(t.Boolean())
})

// System Settings DTOs
export const UpdateSettingsDto = t.Object({
  key: t.String(),
  value: t.Any()
})
