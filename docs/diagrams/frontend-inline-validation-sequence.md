<!--
Tujuan: Mendokumentasikan sequence flow validasi inline frontend untuk form native dan custom select.
Caller: Developer yang ingin memahami alur penanda field wajib sampai error validasi per-field saat submit route.
Dependensi: apps/frontend/src/lib/actions/inline-validation-form.ts dan apps/frontend/src/lib/components/ui/Select.svelte.
Main Functions: Menjadi referensi visual singkat untuk UX validasi inline di form CRUD/admin.
Side Effects: Dokumentasi saja; tidak ada efek runtime.
-->

# Frontend Inline Validation Sequence

```text
User isi field
-> label field menampilkan tanda bintang merah untuk atribut required
-> user submit form
-> browser Constraint Validation API memeriksa required/min/type/minlength
-> inlineValidationForm mencegah tooltip browser default
-> pesan error spesifik tampil di bawah input terkait
-> jika semua valid
-> handler route (handleCreate/handleUpdate/handleSave)
-> fetch API backend
-> refresh data / tampilkan toast sukses-gagal
```
