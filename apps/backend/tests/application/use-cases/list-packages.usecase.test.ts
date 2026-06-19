/*
Tujuan: Menguji ListPackagesUseCase dengan teknik mocking repository.
Caller: Bun test runner.
Dependensi: Bun test, ListPackagesUseCase, PackageEntity, MoneyVO.
*/

import { expect, test, describe } from 'bun:test'
import { ListPackagesUseCase } from '../../../src/application/use-cases/package/list-packages.usecase'
import { PackageEntity } from '../../../src/domain/entities/package.entity'
import type { IPackageRepository } from '../../../src/domain/repositories/package.repository'
import { MoneyVO } from '../../../src/domain/value-objects/money.vo'

describe('ListPackagesUseCase', () => {
  test('should fetch active packages from repository and return their summary models', async () => {
    // 1. Arrange mock package entity
    const mockPkg = new PackageEntity(
      'pkg-id-123',
      'paket-belajar-reguler',
      'Paket Belajar Reguler',
      'Deskripsi Paket',
      'REGULER',
      MoneyVO.create(150000),
      30,
      true,
      1
    )

    // 2. Mock repository implementation
    const mockRepo: Partial<IPackageRepository> = {
      listActive: async () => [mockPkg]
    }

    const useCase = new ListPackagesUseCase(mockRepo as IPackageRepository)

    // 3. Act
    const summaries = await useCase.execute()

    // 4. Assert
    expect(summaries.length).toBe(1)
    expect(summaries[0].id).toBe('pkg-id-123')
    expect(summaries[0].name).toBe('Paket Belajar Reguler')
    expect(summaries[0].priceLabel).toContain('150')
  })
})
