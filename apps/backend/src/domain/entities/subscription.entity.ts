/*
Tujuan: Merepresentasikan langganan aktif murid fase 2 untuk akses materi dan masa berlaku paket.
Caller: Subscription repository, use case active subscription, dan subscription guard.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menyimpan rentang langganan dan helper akses berdasarkan waktu.
Side Effects: Tidak ada; entitas domain murni.
*/

export class SubscriptionEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly branchId: string | null,
    public readonly packageId: string,
    public readonly orderId: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
    public readonly isActive: boolean
  ) {}

  isAccessible(now: Date = new Date()): boolean {
    return this.isActive && this.endsAt.getTime() > now.getTime()
  }
}
