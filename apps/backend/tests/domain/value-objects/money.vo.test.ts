/*
Tujuan: Menguji fungsi validasi dan format Rupiah MoneyVO.
Caller: Bun test runner.
Dependensi: Bun test, MoneyVO.
*/

import { expect, test, describe } from 'bun:test'
import { MoneyVO } from '../../../src/domain/value-objects/money.vo'

describe('MoneyVO', () => {
  test('should create valid MoneyVO with positive integer', () => {
    const money = MoneyVO.create(150000)
    expect(money.amount).toBe(150000)
  })

  test('should throw error for zero, negative or float numbers', () => {
    expect(() => MoneyVO.create(0)).toThrow()
    expect(() => MoneyVO.create(-1000)).toThrow()
    expect(() => MoneyVO.create(1500.5)).toThrow()
  })

  test('should format to IDR Rupiah currency representation', () => {
    const money = MoneyVO.create(150000)
    // format returns 'Rp150.000' or similar depending on the environment,
    // let's check for standard currency notation components
    const formatted = money.formatRupiah()
    expect(formatted).toContain('150')
    expect(formatted).toContain('Rp')
  })
})
