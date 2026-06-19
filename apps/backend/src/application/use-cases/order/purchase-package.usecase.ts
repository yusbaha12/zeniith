/*
Tujuan: Menyediakan use case checkout paket fase 2 untuk membuat order pembelian murid.
Caller: Order controller murid.
Dependensi: DB transaction, package repository, order repository, payment service, dan object storage.
Main Functions: Memvalidasi paket serta bukti transfer, upload file bila ada, lalu membuat order pending secara atomik.
Side Effects: Membaca tabel packages, menulis tabel orders, dan dapat upload object ke MinIO/S3.
*/

import type { PaymentMethod } from '@lms-bimbel/shared'

import type { AppDatabase } from '../../../infrastructure/database/connection'
import type { IPackageRepository } from '../../../domain/repositories/package.repository'
import type { IOrderRepository } from '../../../domain/repositories/order.repository'
import { AppError, NotFoundError } from '../../../shared/errors/app.error'
import { ObjectStorageService } from '../../../infrastructure/storage/object-storage.service'
import { PaymentService } from '../../services/payment.service'

interface PurchasePackageInput {
  userId: string
  branchId: string | null
  packageId: string
  paymentMethod: PaymentMethod
  note?: string | null
  proofFile?: File | null
}

export class PurchasePackageUseCase {
  constructor(
    private readonly database: AppDatabase,
    private readonly packageRepository: IPackageRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly paymentService: PaymentService,
    private readonly objectStorageService: ObjectStorageService
  ) {}

  async execute(input: PurchasePackageInput) {
    const packageItem = await this.packageRepository.findById(input.packageId)

    if (!packageItem || !packageItem.isPurchasable()) {
      throw new NotFoundError('Paket belajar')
    }

    this.paymentService.validateProofFile(input.proofFile, input.paymentMethod)

    const orderCode = this.paymentService.generateOrderCode()
    const expiresAt = this.paymentService.getOrderExpiry()
    let proofObjectKey: string | null = null

    if (input.proofFile) {
      proofObjectKey = this.paymentService.buildProofObjectKey(orderCode, input.proofFile.name)
      await this.objectStorageService.uploadPaymentProof(proofObjectKey, input.proofFile)
    }

    try {
      const order = await this.database.transaction(async (transaction) =>
        this.orderRepository.create({
          userId: input.userId,
          branchId: input.branchId,
          packageId: packageItem.id,
          orderCode,
          amount: packageItem.price.amount,
          paymentMethod: input.paymentMethod,
          proofObjectKey,
          proofFileName: input.proofFile?.name ?? null,
          proofContentType: input.proofFile?.type ?? null,
          note: input.note ?? null,
          expiresAt
        }, transaction)
      )

      return {
        id: order.id,
        orderCode: order.orderCode,
        packageName: packageItem.name,
        amount: order.amount.amount,
        amountLabel: packageItem.price.formatRupiah(),
        status: order.status,
        paymentMethod: order.paymentMethod,
        expiresAt: order.expiresAt
      }
    } catch (error) {
      if (proofObjectKey) {
        await this.objectStorageService.deleteObject(proofObjectKey).catch(() => {
          throw new AppError('Gagal membersihkan bukti transfer sementara', 500, 'PAYMENT_PROOF_CLEANUP_FAILED')
        })
      }

      throw error
    }
  }
}
