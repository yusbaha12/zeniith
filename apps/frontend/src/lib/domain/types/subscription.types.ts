/*
Tujuan: Menyediakan kontrak tipe subscription frontend fase 2 untuk status akses paket murid.
Caller: API subscription frontend dan halaman student terkait akses materi.
Dependensi: Enum package type shared.
Main Functions: Menstandarkan bentuk langganan aktif yang dikirim backend.
Side Effects: Tidak ada; file type murni.
*/

import type { PackageType } from '@lms-bimbel/shared'

export interface ActiveSubscription {
  id: string
  packageId: string
  packageName: string
  packageType: PackageType
  startsAt: string
  endsAt: string
  isActive: boolean
  remainingDays: number
}
