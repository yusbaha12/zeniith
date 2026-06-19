/*
Tujuan: Menyediakan store global untuk lifecycle toast notification internal frontend.
Caller: Helper `notify` dan komponen `ToastHost`.
Dependensi: store bawaan Svelte.
Main Functions: `pushToast`, `removeToast`, dan store `toastItems` untuk render toast lintas halaman.
Side Effects: Menjadwalkan auto-dismiss toast dengan timer browser.
*/

import { writable } from 'svelte/store'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type ToastItem = {
  id: string
  message: string
  type: ToastType
  duration: number
}

type PushToastInput = {
  message: string
  type: ToastType
  duration: number
}

export const toastItems = writable<ToastItem[]>([])

export function pushToast(input: PushToastInput) {
  const item: ToastItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    message: input.message,
    type: input.type,
    duration: input.duration
  }

  toastItems.update((items) => [...items, item].slice(-4))

  if (typeof window !== 'undefined') {
    window.setTimeout(() => removeToast(item.id), input.duration)
  }

  return item.id
}

export function removeToast(id: string) {
  toastItems.update((items) => items.filter((item) => item.id !== id))
}
