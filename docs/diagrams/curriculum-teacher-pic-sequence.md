<!--
Tujuan: Mendokumentasikan sequence assignment PIC guru pada kurikulum.
Caller: SYSTEM_MAP.md, developer, dan sesi validasi fitur kurikulum.
Dependensi: Superadmin kurikulum route, SuperAdminController, ModuleRepositoryImpl, subject_teacher_assignments, Teacher material endpoints.
Main Functions: Menjelaskan rule PIC kosong = semua guru dan enforcement akses guru saat list/create/update/delete materi.
Side Effects: Dokumentasi saja; tidak ada DB write, HTTP call, atau file I/O runtime.
-->

# Curriculum Teacher PIC Sequence

```mermaid
sequenceDiagram
  autonumber
  actor Admin as Superadmin
  actor Teacher as Guru
  participant CurriculumPage as /superadmin/kurikulum
  participant Controller as SuperAdminController
  participant ModuleRepo as ModuleRepositoryImpl
  participant MaterialApi as Teacher Material API
  participant MaterialUseCase as Material Use Cases
  participant DB as PostgreSQL

  Admin->>CurriculumPage: Pilih PIC guru saat tambah/edit mapel
  CurriculumPage->>Controller: POST/PATCH /api/superadmin/subjects teacherIds[]
  Controller->>ModuleRepo: createSubject/updateSubject(teacherIds)
  ModuleRepo->>DB: Transaction subjects + replace subject_teacher_assignments
  DB-->>ModuleRepo: Commit
  ModuleRepo-->>Controller: Subject + teacherIds
  Controller-->>CurriculumPage: Response success

  Teacher->>MaterialApi: GET /api/subjects
  MaterialApi->>ModuleRepo: listActiveSubjectsForTeacher(teacherId)
  ModuleRepo->>DB: SELECT subjects WHERE no assignment OR assignment matches teacher
  DB-->>ModuleRepo: Subject yang boleh diakses
  ModuleRepo-->>MaterialApi: Subject list
  MaterialApi-->>Teacher: Mapel sesuai PIC

  Teacher->>MaterialApi: Create/Edit/Delete materi
  MaterialApi->>MaterialUseCase: Execute with teacherId
  MaterialUseCase->>ModuleRepo: teacherCanAccessSubject(subjectId, teacherId)
  ModuleRepo->>DB: Count assignment + matched assignment
  DB-->>ModuleRepo: assignmentCount, matchedCount
  alt assignment kosong
    ModuleRepo-->>MaterialUseCase: allowed
  else teacher termasuk PIC
    ModuleRepo-->>MaterialUseCase: allowed
  else teacher bukan PIC
    ModuleRepo-->>MaterialUseCase: forbidden
  end
  MaterialUseCase-->>MaterialApi: Continue atau 403
```
