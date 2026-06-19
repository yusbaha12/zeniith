/*
Tujuan: Menyediakan kontrak tipe paket belajar frontend fase 2 untuk katalog dan checkout.
Caller: Halaman `/paket`, detail paket, checkout, dan API paket.
Dependensi: Enum package type shared.
Main Functions: Menstandarkan bentuk data paket dan fitur dari backend phase 2.
Side Effects: Tidak ada; file type murni.
*/

import type { PackageType } from '@lms-bimbel/shared'

export interface FrontendPackageFeature {
  id: string
  packageId: string
  title: string
  description: string | null
  sortOrder: number
}

export interface FrontendPackageSummary {
  id: string
  slug: string
  name: string
  description: string
  type: PackageType
  price: number
  priceLabel: string
  durationDays: number
  isActive: boolean
}

export interface FrontendPackageDetail extends FrontendPackageSummary {
  features: FrontendPackageFeature[]
}
