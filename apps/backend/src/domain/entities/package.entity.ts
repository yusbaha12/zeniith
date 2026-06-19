/*
Tujuan: Merepresentasikan entitas paket belajar fase 2 untuk katalog dan checkout.
Caller: Package repository, use case katalog, dan use case pembelian paket.
Dependensi: PackageType shared dan MoneyVO.
Main Functions: Menyimpan metadata paket serta helper untuk publikasi dan ringkasan katalog.
Side Effects: Tidak ada; entitas domain murni.
*/

import type { PackageType } from '@lms-bimbel/shared'

import { MoneyVO } from '../value-objects/money.vo'

export interface PackageSummary {
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

export interface PackageAccessSummary extends PackageSummary {
  isSubscribed: boolean
}

export class PackageEntity {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly name: string,
    public readonly description: string,
    public readonly type: PackageType,
    public readonly price: MoneyVO,
    public readonly durationDays: number,
    public readonly isActive: boolean,
    public readonly sortOrder: number
  ) {}

  isPurchasable(): boolean {
    return this.isActive
  }

  toSummary(): PackageSummary {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      description: this.description,
      type: this.type,
      price: this.price.amount,
      priceLabel: this.price.formatRupiah(),
      durationDays: this.durationDays,
      isActive: this.isActive
    }
  }
}
