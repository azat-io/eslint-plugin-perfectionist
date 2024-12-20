import { describe, expect, it } from 'vitest'

import { getArrayCombinations } from '../../utils/get-array-combinations'

describe('get-array-combinations', () => {
  it('gets array combinations', () => {
    expect(getArrayCombinations(['a', 'b', 'c', 'd'], 3)).toStrictEqual([
      ['a', 'b', 'c'],
      ['a', 'b', 'd'],
      ['a', 'c', 'd'],
      ['b', 'c', 'd'],
    ])
  })
})
