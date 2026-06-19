/*
Tujuan: Merepresentasikan entitas modul belajar fase 3 untuk daftar modul dan progres belajar.
Caller: Module repository, use case daftar modul, dan teacher material management.
Dependensi: Tidak ada dependensi eksternal.
Main Functions: Menyimpan metadata modul dan helper output ringkas untuk frontend.
Side Effects: Tidak ada; entitas domain murni.
*/

export interface ModuleSummary {
  id: string
  subjectId: string
  title: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

export class ModuleEntity {
  constructor(
    public readonly id: string,
    public readonly subjectId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly sortOrder: number,
    public readonly isActive: boolean
  ) {}

  toSummary(): ModuleSummary {
    return {
      id: this.id,
      subjectId: this.subjectId,
      title: this.title,
      slug: this.slug,
      description: this.description,
      sortOrder: this.sortOrder,
      isActive: this.isActive
    }
  }
}
