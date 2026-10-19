import { describe, expect, it } from 'vitest'

import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'

describe('does-custom-group-match', () => {
  describe('selectors', () => {
    it('returns true if custom group matches at least one selector', () => {
      expect(
        doesCustomGroupMatch({
          customGroup: {
            selector: 'selector1',
          },
          selectors: ['selector1'],
          elementName: '',
          modifiers: [],
        }),
      ).toBe(true)
    })

    it('returns false if custom group does not match at least one selector', () => {
      expect(
        doesCustomGroupMatch({
          customGroup: {
            selector: 'selector1',
          },
          selectors: ['selector2'],
          elementName: '',
          modifiers: [],
        }),
      ).toBe(false)
    })
  })

  describe('modifiers', () => {
    it('returns true if custom group matches all modifiers', () => {
      expect(
        doesCustomGroupMatch({
          customGroup: {
            modifiers: ['modifier1', 'modifier2'],
          },
          modifiers: ['modifier2', 'modifier1'],
          elementName: '',
          selectors: [],
        }),
      ).toBe(true)
    })

    it('returns false if custom group does not match all modifiers', () => {
      expect(
        doesCustomGroupMatch({
          customGroup: {
            modifiers: ['modifier1', 'modifier2'],
          },
          modifiers: ['modifier1'],
          elementName: '',
          selectors: [],
        }),
      ).toBe(false)
    })
  })

  it.each([
    'hello',
    ['noMatch', 'hello'],
    { pattern: 'HELLO', flags: 'i' },
    ['noMatch', { pattern: 'HELLO', flags: 'i' }],
  ])(
    'returns true if custom group matches elementNamePattern',
    elementNamePattern => {
      expect(
        doesCustomGroupMatch({
          customGroup: {
            elementNamePattern,
          },
          elementName: 'hello',
          modifiers: [],
          selectors: [],
        }),
      ).toBe(true)
    },
  )

  it.each([
    'hello',
    ['noMatch', 'hello'],
    { pattern: 'HELLO', flags: 'i' },
    ['noMatch', { pattern: 'HELLO', flags: 'i' }],
  ])(
    'returns true if custom group matches elementValuePattern',
    elementValuePattern => {
      expect(
        doesCustomGroupMatch({
          customGroup: {
            elementValuePattern,
          },
          elementValue: 'hello',
          elementName: '',
          modifiers: [],
          selectors: [],
        }),
      ).toBe(true)
    },
  )

  it.each([
    'hello',
    ['noMatch', 'hello'],
    { pattern: 'HELLO', flags: 'i' },
    ['noMatch', { pattern: 'HELLO', flags: 'i' }],
  ])(
    'returns true if custom group matches decoratorNamePattern',
    decoratorNamePattern => {
      expect(
        doesCustomGroupMatch({
          customGroup: {
            decoratorNamePattern,
          },
          decoratorNames: ['foo', 'hello'],
          elementName: '',
          modifiers: [],
          selectors: [],
        }),
      ).toBe(true)
    },
  )
})
