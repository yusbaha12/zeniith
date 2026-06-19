/*
Tujuan: Mendefinisikan kontrak repository paket fase 2 untuk katalog publik dan checkout.
Caller: Use case daftar paket, detail paket, dan pembelian paket.
Dependensi: PackageEntity domain.
Main Functions: Menyediakan operasi baca paket dan fitur paket secara efisien.
Side Effects: Tidak ada; file kontrak interface.
*/

import type { PackageEntity } from '../entities/package.entity'

export interface PackageFeatureRecord {
  id: string
  packageId: string
  title: string
  description: string | null
  sortOrder: number
}

export interface IPackageRepository {
  listActive(): Promise<PackageEntity[]>
  findById(id: string): Promise<PackageEntity | null>
  listFeaturesByPackageId(packageId: string): Promise<PackageFeatureRecord[]>
  listAll(): Promise<PackageEntity[]>
  create(input: {
    name: string
    type: 'REGULER' | 'INTENSIF' | 'PREMIUM'
    description: string | null
    price: number
    durationDays: number
    isActive: boolean
    sortOrder: number
  }): Promise<PackageEntity>
  update(
    id: string,
    input: Partial<{
      name: string
      type: 'REGULER' | 'INTENSIF' | 'PREMIUM'
      description: string | null
      price: number
      durationDays: number
      isActive: boolean
      sortOrder: number
    }>
  ): Promise<PackageEntity>
  delete(id: string): Promise<void>
  findFeatureById(id: string): Promise<PackageFeatureRecord | null>
  createFeature(input: {
    packageId: string
    title: string
    description: string | null
    sortOrder: number
  }): Promise<PackageFeatureRecord>
  updateFeature(
    id: string,
    input: Partial<{
      title: string
      description: string | null
      sortOrder: number
    }>
  ): Promise<PackageFeatureRecord>
  deleteFeature(id: string): Promise<void>
  assignSubjects(packageId: string, subjectIds: string[], executor?: unknown): Promise<void>
  listSubjectsByPackageId(packageId: string): Promise<string[]>
}

