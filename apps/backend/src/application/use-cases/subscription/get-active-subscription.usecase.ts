/*
Tujuan: Menyediakan use case langganan aktif fase 2 untuk guard akses belajar murid.
Caller: Subscription controller dan route frontend yang menampilkan status akses paket.
Dependensi: ISubscriptionRepository.
Main Functions: Mengambil langganan aktif murid lalu menghitung sisa hari akses.
Side Effects: Membaca tabel subscriptions dan packages melalui repository.
*/

import type { ISubscriptionRepository } from '../../../domain/repositories/subscription.repository'

export class GetActiveSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(userId: string) {
    const subscription = await this.subscriptionRepository.getActiveViewByUserId(userId)

    if (!subscription) {
      return null
    }

    const diffInDays = Math.max(
      0,
      Math.ceil((subscription.endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    )

    return {
      ...subscription,
      remainingDays: diffInDays
    }
  }
}
