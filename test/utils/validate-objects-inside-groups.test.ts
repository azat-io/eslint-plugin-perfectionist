import { describe, expect, it } from 'vitest'

import { validateObjectsInsideGroups } from '../../utils/validate-objects-inside-groups'

describe('validate-objects-inside-groups', () => {
  it('does not throw an error with consecutive objects-based elements', () => {
    expect(() => {
      validateObjectsInsideGroups({
        groups: [
          'a',
          ['b'],
          ['c'],
          { commentAbove: 'foo', group: 'd' },
          { commentAbove: 'bar', group: ['e'] },
        ],
      })
    }).not.toThrow()
  })

  it('throws an error with consecutive non-groups objects-based elements', () => {
    expect(() => {
      validateObjectsInsideGroups({
        groups: ['a', { newlinesBetween: 1 }, { newlinesBetween: 1 }, ['b']],
      })
    }).toThrow('Consecutive `newlinesBetween` objects are not allowed')
  })
})
