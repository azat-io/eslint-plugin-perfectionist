import { describe, expect, it } from 'vitest'

import { getMatchingContextOptions } from '../utils/get-matching-context-options'

describe('get-matching-context-options', () => {
  describe('`allNamesMatchPattern`', () => {
    it('matches the appropriate context options with `allNamesMatchPattern`', () => {
      let barContextOptions = buildContextOptions('bar')
      let contextOptions = [buildContextOptions('foo'), barContextOptions]
      let nodeNames = ['bar1', 'bar2']

      expect(getMatchingContextOptions({ contextOptions, nodeNames })).toEqual(
        barContextOptions,
      )
    })

    it('returns `undefined` if no configuration matches', () => {
      let contextOptions = [buildContextOptions('foo')]
      let nodeNames = ['bar1', 'bar2']

      expect(
        getMatchingContextOptions({ contextOptions, nodeNames }),
      ).toBeUndefined()
    })

    it('returns the first context options if no filters are entered', () => {
      let emptyContextOptions = buildContextOptions()
      let contextOptions = [emptyContextOptions, buildContextOptions()]
      let nodeNames = ['bar1', 'bar2']

      expect(getMatchingContextOptions({ contextOptions, nodeNames })).toEqual(
        emptyContextOptions,
      )
    })
  })

  let buildContextOptions = (
    allNamesMatchPattern?: string,
  ): { useConfigurationIf: { allNamesMatchPattern?: string } } => ({
    useConfigurationIf: {
      ...(allNamesMatchPattern ? { allNamesMatchPattern } : {}),
    },
  })
})
