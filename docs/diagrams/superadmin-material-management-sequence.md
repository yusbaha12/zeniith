<!--
Tujuan: Mendokumentasikan sequence Kelola Materi Superadmin.
Caller: SYSTEM_MAP.md, developer, dan sesi validasi fitur materi admin.
Dependensi: SvelteKit superadmin routes, materialApi, SuperAdminController, Superadmin material use cases, MaterialRepositoryImpl, PostgreSQL, MinIO/S3.
Main Functions: Menjelaskan alur list, create/update, upload asset, dan delete materi global.
Side Effects: Dokumentasi saja; tidak ada DB write, HTTP call, atau file I/O runtime.
-->

# Superadmin Material Management Sequence

```mermaid
sequenceDiagram
  autonumber
  actor Admin as Superadmin
  participant Page as /superadmin/materi*
  participant Api as materialApi
  participant Controller as SuperAdminController
  participant UseCase as Superadmin Material Use Cases
  participant Repo as MaterialRepositoryImpl
  participant DB as PostgreSQL
  participant Storage as MinIO/S3

  Admin->>Page: Buka Kelola Materi
  Page->>Api: listSuperadminMaterials(q, subjectId, isPublished)
  Api->>Controller: GET /api/superadmin/materials?q=&subjectId=&isPublished=
  Controller->>UseCase: SuperadminListMaterialsUseCase.execute(filters)
  UseCase->>Repo: listAllForAdmin(filters)
  Repo->>DB: SELECT materials JOIN modules JOIN subjects
  DB-->>Repo: Daftar materi global
  Repo-->>UseCase: TeacherMaterialListItem[]
  UseCase-->>Controller: Payload daftar materi
  Controller-->>Api: Response success
  Api-->>Page: Render list hasil filter backend

  Admin->>Page: Buat/Edit materi
  Page->>Api: uploadSuperadminImage() bila ada gambar editor
  Api->>Controller: POST /api/superadmin/materials/assets/image
  Controller->>Storage: Upload object editor
  Storage-->>Controller: objectKey + preview URL

  Page->>Api: create/update FormData
  Api->>Controller: POST/PATCH /api/superadmin/materials
  Controller->>UseCase: CreateMaterialUseCase atau SuperadminUpdateMaterialUseCase
  UseCase->>Storage: Upload attachment opsional
  UseCase->>Repo: create/update dalam DB transaction
  Repo->>DB: INSERT/UPDATE materials
  DB-->>Repo: Row materi
  Repo-->>UseCase: Material summary
  UseCase-->>Controller: Result
  Controller-->>Api: Response success
  Api-->>Page: Toast + redirect daftar

  Admin->>Page: Hapus materi
  Page->>Api: deleteSuperadminMaterial(id)
  Api->>Controller: DELETE /api/superadmin/materials/:id
  Controller->>UseCase: SuperadminDeleteMaterialUseCase.execute(id)
  UseCase->>Repo: findById lalu delete dalam DB transaction
  Repo->>DB: DELETE materials (progress cascade)
  DB-->>Repo: OK
  Repo-->>UseCase: Deleted
  UseCase-->>Controller: id terhapus
  Controller-->>Api: Response success
  Api-->>Page: Toast + reload daftar
```
