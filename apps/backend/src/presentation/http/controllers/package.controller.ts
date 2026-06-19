/*
Tujuan: Menyediakan endpoint publik fase 2 untuk daftar dan detail paket belajar.
Caller: Frontend halaman `/paket`, detail paket, dan checkout.
Dependensi: Use case list packages, detail package, dan DTO params paket.
Main Functions: Mengembalikan katalog paket aktif dengan envelope response konsisten.
Side Effects: Membaca tabel packages dan package_features melalui use case.
*/

import { Elysia } from 'elysia'

import { PackageIdParamsDto } from '../../../application/dto/package.dto'
import type { GetPackageDetailUseCase } from '../../../application/use-cases/package/get-package-detail.usecase'
import type { ListPackagesUseCase } from '../../../application/use-cases/package/list-packages.usecase'

export const createPackageController = (
  listPackagesUseCase: ListPackagesUseCase,
  getPackageDetailUseCase: GetPackageDetailUseCase
) =>
  new Elysia({ prefix: '/api/packages' })
    .get('/', async () => ({
      success: true,
      data: await listPackagesUseCase.execute(),
      message: 'Daftar paket berhasil diambil'
    }))
    .get('/:id', async ({ params }) => ({
      success: true,
      data: await getPackageDetailUseCase.execute(params.id),
      message: 'Detail paket berhasil diambil'
    }), {
      params: PackageIdParamsDto
    })
