import { describe, expect, it } from 'vitest'

import { buildStringFormatter } from '../../../utils/compare/build-string-formatter'

describe('build-string-formatter', () => {
  it("should ignore case when 'ignoreCase' is true", () => {
    let formatString = buildStringFormatter({
      specialCharacters: 'keep',
      ignoreCase: true,
    })
    expect(formatString('FooBar')).toBe('foobar')
  })

  it('should remove space characters', () => {
    let formatString = buildStringFormatter({
      specialCharacters: 'keep',
      ignoreCase: false,
    })
    expect(formatString('a b c d e fg h')).toBe('abcdefgh')
  })

  describe('special characters', () => {
    let stringWithSpecialCharacters = '!@#Foo,Bar!$%^'

    it("should remove special characters when option is 'remove'", () => {
      let formatString = buildStringFormatter({
        specialCharacters: 'remove',
        ignoreCase: false,
      })
      expect(formatString(stringWithSpecialCharacters)).toBe('FooBar')
    })

    it("should keep special characters when option is 'keep'", () => {
      let formatString = buildStringFormatter({
        specialCharacters: 'keep',
        ignoreCase: false,
      })
      expect(formatString(stringWithSpecialCharacters)).toBe('!@#Foo,Bar!$%^')
    })

    it("should trim left leading special characters when option is 'trim'", () => {
      let formatString = buildStringFormatter({
        specialCharacters: 'trim',
        ignoreCase: false,
      })
      expect(formatString(stringWithSpecialCharacters)).toBe('Foo,Bar!$%^')
    })
  })
})
