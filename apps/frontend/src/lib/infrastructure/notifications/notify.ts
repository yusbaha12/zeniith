/*
Tujuan: Menyediakan helper toast global internal untuk sukses, error, info, dan warning dengan gaya neobrutalism.
Caller: Route/page/frontend module yang membutuhkan feedback aksi simpan, ubah, hapus, login, atau error operasi.
Dependensi: toast-store internal.
Main Functions: Membungkus penambahan toast ke store global dengan durasi dan tipe konsisten.
Side Effects: Menambahkan item toast ke state global yang dirender oleh host layout.
*/

import { pushToast } from './toast-store'

const DEFAULT_DURATION = 3200

export const notify = {
  success(message: string) {
    return pushToast({ message, type: 'success', duration: DEFAULT_DURATION })
  },

  error(message: string) {
    return pushToast({ message, type: 'error', duration: 4200 })
  },

  info(message: string) {
    return pushToast({ message, type: 'info', duration: DEFAULT_DURATION })
  },

  warning(message: string) {
    return pushToast({ message, type: 'warning', duration: 3800 })
  }
}
