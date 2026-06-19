/*
Tujuan: Merepresentasikan entitas cabang yang dipakai pada fase auth dan registrasi.
Caller: Branch repository, use case list branch, dan response register frontend.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menyimpan data inti cabang dan helper status aktif.
Side Effects: Tidak ada; entitas domain murni.
*/

export class BranchEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly address: string | null,
    public readonly city: string | null,
    public readonly phone: string | null,
    public readonly isActive: boolean
  ) {}

  canAcceptRegistration(): boolean {
    return this.isActive
  }
}
