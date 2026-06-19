<!--
Tujuan: Menjelaskan urutan resolusi permission efektif dari role, mapping role permission, override user, dan cache authz.
Caller: Developer backend/frontend, reviewer, dan sesi implementasi fase 7-8.
Dependensi: lms-bimbel-docs/docs/rbac.md, lms-bimbel-docs/docs/database.md, dan schema RBAC backend.
Main Functions: Menjadi referensi visual untuk flow evaluasi permission saat request sensitif diproses.
Side Effects: Dokumentasi saja; tidak ada DB write, HTTP call, atau file I/O runtime.
-->

# Sequence Diagram — RBAC Permission Resolution

```text
HTTP Request
-> Auth Middleware
-> Resolve User Session
-> Check Area Role Guard
-> Load authz:user:{userId} dari Redis
  -> hit: return effective permissions
  -> miss:
     -> query users.role
     -> query role_permissions + permissions
     -> query user_permissions aktif
     -> merge baseline + override (DENY menang atas ALLOW)
     -> cache ke authz:user:{userId}
-> Permission Middleware
-> Controller / Use Case
-> Response
```
