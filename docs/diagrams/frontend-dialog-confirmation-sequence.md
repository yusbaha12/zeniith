<!--
Tujuan: Mendokumentasikan sequence flow dialog konfirmasi frontend berbasis SweetAlert2.
Caller: Developer yang ingin memahami alur pengganti alert/confirm browser native.
Dependensi: apps/frontend/src/lib/infrastructure/dialog/dialog.ts, sweetalert2, dan apps/frontend/src/app.css.
Main Functions: Menjadi referensi visual singkat untuk dialog.alert, dialog.error, dan dialog.confirm bergaya neobrutalism.
Side Effects: Dokumentasi saja; tidak ada efek runtime.
-->

# Frontend Dialog Confirmation Sequence

```text
User klik aksi destruktif / aksi penting
-> handler route memanggil dialog.confirm
-> wrapper SweetAlert2 memakai preset class neobrutalism
-> user memilih konfirmasi atau batal
-> jika batal, handler berhenti tanpa HTTP call
-> jika konfirmasi, handler lanjut fetch/apiClient
-> hasil sukses tampil lewat toast
-> hasil gagal tampil lewat toast atau dialog.error sesuai konteks halaman
```
