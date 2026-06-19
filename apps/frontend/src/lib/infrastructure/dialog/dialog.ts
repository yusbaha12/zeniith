/*
Tujuan: Menyediakan wrapper SweetAlert2 bergaya neobrutalism untuk alert dan konfirmasi.
Caller: Route/page frontend yang membutuhkan dialog pengganti alert/confirm browser native.
Dependensi: sweetalert2 dan stylesheet global app.css.
Main Functions: `dialog.alert`, `dialog.confirm`, dan `dialog.error` dengan class dan teks tombol konsisten.
Side Effects: Menampilkan modal SweetAlert2 di browser.
*/

import Swal, { type SweetAlertIcon } from 'sweetalert2'

type AlertOptions = {
  title?: string
  message: string
  icon?: SweetAlertIcon
  confirmText?: string
}

type ConfirmOptions = {
  title?: string
  message: string
  icon?: SweetAlertIcon
  confirmText?: string
  cancelText?: string
}

const NeobrutalistSwal = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
  customClass: {
    container: 'neo-swal-container',
    popup: 'neo-swal-popup',
    title: 'neo-swal-title',
    htmlContainer: 'neo-swal-html',
    icon: 'neo-swal-icon',
    actions: 'neo-swal-actions',
    confirmButton: 'neo-swal-button neo-swal-confirm',
    cancelButton: 'neo-swal-button neo-swal-cancel'
  }
})

export const dialog = {
  async alert(options: AlertOptions) {
    await NeobrutalistSwal.fire({
      title: options.title ?? 'Informasi',
      text: options.message,
      icon: options.icon ?? 'info',
      confirmButtonText: options.confirmText ?? 'Oke'
    })
  },

  async error(message: string, title = 'Gagal') {
    await NeobrutalistSwal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Mengerti'
    })
  },

  async confirm(options: ConfirmOptions) {
    const result = await NeobrutalistSwal.fire({
      title: options.title ?? 'Konfirmasi',
      text: options.message,
      icon: options.icon ?? 'warning',
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? 'Ya, lanjutkan',
      cancelButtonText: options.cancelText ?? 'Batal'
    })

    return result.isConfirmed
  }
}
