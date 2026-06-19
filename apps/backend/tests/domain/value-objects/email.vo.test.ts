/*
Tujuan: Menguji fungsi validasi dan normalisasi EmailVO.
Caller: Bun test runner.
Dependensi: Bun test, EmailVO, AppError.
*/

import { expect, test, describe } from 'bun:test'
import { EmailVO } from '../../../src/domain/value-objects/email.vo'

describe('EmailVO', () => {
  test('should create a valid email successfully and normalize it to lowercase', () => {
    const email = EmailVO.create('  YUSUF@zeniith.com  ')
    expect(email.value).toBe('yusuf@zeniith.com')
  })

  test('should throw validation AppError on invalid email pattern', () => {
    expect(() => EmailVO.create('invalidemail')).toThrow()
    expect(() => EmailVO.create('yusuf@')).toThrow()
    expect(() => EmailVO.create('@zeniith.com')).toThrow()
  })
})
