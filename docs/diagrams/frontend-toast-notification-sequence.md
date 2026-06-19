<!--
Tujuan: Mendokumentasikan sequence flow notifikasi toast frontend setelah aksi form atau aksi operasional lain.
Caller: Developer yang ingin memahami alur feedback sukses/gagal lintas halaman tanpa banner inline.
Dependensi: apps/frontend/src/lib/infrastructure/notifications/notify.ts, toast-store internal, dan apps/frontend/src/routes/+layout.svelte.
Main Functions: Menjadi referensi visual singkat untuk helper notify, ToastHost global, dan styling neobrutalism.
Side Effects: Dokumentasi saja; tidak ada efek runtime.
-->

# Frontend Toast Notification Sequence

```text
User submit form / trigger aksi
-> handler route (handleSave / handleCreate / handleDelete / login / checkout)
-> fetch API backend atau proses lokal
-> hasil sukses / gagal diterima
-> handler memanggil notify.success / notify.error / notify.info / notify.warning
-> helper notify menambahkan toast ke store global internal
-> ToastHost global di routes/+layout.svelte membaca store dan merender toast aktif
-> toast muncul di kanan atas dengan style border tebal, shadow, dan warna kontras
-> route bisa tetap redirect / refresh data tanpa perlu banner inline
```
