import { describe, expect, it } from 'vitest'

import { passesAllNamesMatchPatternFilter } from '../../../utils/context-matching/passes-all-names-match-pattern-filter'

describe('passes-all-names-match-pattern-filter', () => {
  it.each([undefined, ''])(
    'returns true if `allNamesMatchPattern` %s',
    allNamesMatchPattern => {
      let nodeNames = ['bar1', 'bar2']

      expect(
        passesAllNamesMatchPatternFilter({ allNamesMatchPattern, nodeNames }),
      ).toBe(true)
    },
  )

  it('returns true if the configuration matches `allNamesMatchPattern`', () => {
    let nodeNames = ['bar1', 'bar&foo']

    expect(
      passesAllNamesMatchPatternFilter({
        allNamesMatchPattern: 'bar',
        nodeNames,
      }),
    ).toBe(true)
  })

  it('returns false if the configuration does not matches `allNamesMatchPattern`', () => {
    let nodeNames = ['bar1', 'bar&foo']

    expect(
      passesAllNamesMatchPatternFilter({
        allNamesMatchPattern: 'foo',
        nodeNames,
      }),
    ).toBe(false)
  })

  it('returns false if the configuration does not matches', () => {
    let nodeNames = ['bar1', 'bar2']

    expect(
      passesAllNamesMatchPatternFilter({
        allNamesMatchPattern: 'foo',
        nodeNames,
      }),
    ).toBe(false)
  })
})
