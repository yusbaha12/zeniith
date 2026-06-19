/*
Tujuan: Mendefinisikan kontrak repository admin untuk statistik, audit logs, dan settings fase 7.
Caller: Use case dashboard admin cabang dan super admin.
Dependensi: TypeScript type system.
Main Functions: Menyediakan operasi query agregasi statistik cabang/nasional, logging audit, dan konfigurasi sistem.
Side Effects: Tidak ada; file kontrak interface.
*/

export interface BranchStats {
  avgScore: number
  activeStudents: number
}

export interface NationalStats {
  avgScore: number
  activeStudents: number
  totalBranches: number
  totalStudents: number
}

export interface IAdminRepository {
  getBranchStats(branchId: string): Promise<BranchStats>
  getNationalStats(): Promise<NationalStats>
  getAuditLogs(limit: number): Promise<any[]>
  getSetting(key: string): Promise<Record<string, unknown> | null>
  saveSetting(key: string, value: Record<string, unknown>): Promise<void>
  getBranchReportData(branchId: string | null): Promise<any[]>
}
