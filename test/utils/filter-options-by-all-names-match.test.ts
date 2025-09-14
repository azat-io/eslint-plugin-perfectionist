import { describe, expect, it } from 'vitest'

import type { RegexOption } from '../../types/common-options'

import { filterOptionsByAllNamesMatch } from '../../utils/filter-options-by-all-names-match'

describe('filter-options-by-all-names-match', () => {
  it('returns options with `allNamesMatchPattern` undefined or empty', () => {
    let undefinedContextOptions = buildContextOptions()
    let emptyContextOptions = buildContextOptions('')
    let contextOptions = [undefinedContextOptions, emptyContextOptions]
    let nodeNames = ['bar1', 'bar2']

    expect(filterOptionsByAllNamesMatch({ contextOptions, nodeNames })).toEqual(
      [undefinedContextOptions, emptyContextOptions],
    )
  })

  it('returns options where all node names match `allNamesMatchPattern`', () => {
    let barContextOptions = buildContextOptions('bar')
    let contextOptions = [buildContextOptions('foo'), barContextOptions]
    let nodeNames = ['bar1', 'bar&foo']

    expect(filterOptionsByAllNamesMatch({ contextOptions, nodeNames })).toEqual(
      [barContextOptions],
    )
  })

  it('returns [] if no configuration matches', () => {
    let contextOptions = [buildContextOptions('foo')]
    let nodeNames = ['bar1', 'bar2']

    expect(filterOptionsByAllNamesMatch({ contextOptions, nodeNames })).toEqual(
      [],
    )
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
