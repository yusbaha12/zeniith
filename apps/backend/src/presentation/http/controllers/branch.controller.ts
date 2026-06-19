/*
Tujuan: Menyediakan endpoint publik daftar cabang aktif untuk register fase 1.
Caller: Bootstrap backend dan frontend halaman daftar.
Dependensi: ListBranchesUseCase.
Main Functions: Mengembalikan daftar cabang aktif dalam envelope response konsisten.
Side Effects: Membaca tabel branches.
*/

import { Elysia } from 'elysia'

import type { ListBranchesUseCase } from '../../../application/use-cases/branch/list-branches.usecase'

export const createBranchController = (listBranchesUseCase: ListBranchesUseCase) =>
  new Elysia({ prefix: '/api' }).get('/branches', async () => ({
    success: true,
    data: await listBranchesUseCase.execute(),
    message: 'Daftar cabang aktif berhasil diambil'
  }))
