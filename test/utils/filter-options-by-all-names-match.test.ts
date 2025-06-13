import { describe, expect, it } from 'vitest'

import type { RegexOption } from '../../types/common-options'

import { filterOptionsByAllNamesMatch } from '../../utils/filter-options-by-all-names-match'

describe('filter-options-by-all-names-match', () => {
  describe('`allNamesMatchPattern`', () => {
    it('matches the appropriate context options with `allNamesMatchPattern`', () => {
      let barContextOptions = buildContextOptions('bar')
      let contextOptions = [buildContextOptions('foo'), barContextOptions]
      let nodeNames = ['bar1', 'bar2']

      expect(
        filterOptionsByAllNamesMatch({ contextOptions, nodeNames }),
      ).toEqual([barContextOptions])
    })

    it('returns [] if no configuration matches', () => {
      let contextOptions = [buildContextOptions('foo')]
      let nodeNames = ['bar1', 'bar2']

      expect(
        filterOptionsByAllNamesMatch({ contextOptions, nodeNames }),
      ).toEqual([])
    })

    it('returns all context options if no filters are entered', () => {
      let emptyContextOptions = buildContextOptions()
      let secondContextOptions = buildContextOptions()
      let contextOptions = [emptyContextOptions, buildContextOptions()]
      let nodeNames = ['bar1', 'bar2']

      expect(
        filterOptionsByAllNamesMatch({ contextOptions, nodeNames }),
      ).toEqual([emptyContextOptions, secondContextOptions])
    })
  })

  function buildContextOptions(allNamesMatchPattern?: RegexOption): {
    useConfigurationIf: { allNamesMatchPattern?: RegexOption }
  } {
    return {
      useConfigurationIf: {
        ...(allNamesMatchPattern ? { allNamesMatchPattern } : {}),
      },
    }
  }
})
