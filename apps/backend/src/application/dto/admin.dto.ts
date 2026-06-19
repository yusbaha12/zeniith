import { t } from 'elysia'

export const ListUsersQueryDto = t.Object({
  role: t.Optional(
    t.Union([
      t.Literal('SUPER_ADMIN'),
      t.Literal('BRANCH_ADMIN'),
      t.Literal('TEACHER'),
      t.Literal('STUDENT')
    ])
  ),
  branchId: t.Optional(t.String({ format: 'uuid' })),
  searchQuery: t.Optional(t.String())
})

export const ExportReportQueryDto = t.Object({
  branchId: t.Optional(t.String({ format: 'uuid' }))
})
