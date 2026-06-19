/*
Tujuan: Merepresentasikan entitas log proctoring dan peringatan kecurangan fase 6.
Caller: Proctor repository, use case log proctor event, dan monitor guru.
Dependensi: ProctorEventType dari @lms-bimbel/shared.
Main Functions: Menyimpan data event proctoring dan peringatan ke murid.
Side Effects: Tidak ada; entitas domain murni.
*/

import type { ProctorEventType } from '@lms-bimbel/shared'

export class ProctorLogEntity {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly eventType: ProctorEventType,
    public readonly metadata: Record<string, unknown>,
    public readonly occurredAt: Date
  ) {}
}

export class ProctorWarningEntity {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly warningCount: number,
    public readonly message: string,
    public readonly createdAt: Date
  ) {}
}
