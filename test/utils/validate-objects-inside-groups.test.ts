import { describe, expect, it } from 'vitest'

import { validateObjectsInsideGroups } from '../../utils/validate-objects-inside-groups'

describe('validate-objects-inside-groups', () => {
  it.each(buildAllPossibleCases())(
    'throws an error with consecutive objects-based elements (%s)',
    ({ second, first }) => {
      expect(() => {
        validateObjectsInsideGroups({
          groups: [first, second],
        })
      }).toThrow(
        'Consecutive objects (`newlinesBetween` or `commentAbove` are not allowed: merge them into a single object',
      )
    },
  )
})

function buildAllPossibleCases(): {
  second: (typeof cases)[number]
  first: (typeof cases)[number]
}[] {
  let cases = [
    { newlinesBetween: 1 },
    { commentAbove: 'comment' },
    { commentAbove: 'comment', newlinesBetween: 1 },
  ] as const

  let returnValue: {
    second: (typeof cases)[number]
    first: (typeof cases)[number]
  }[] = []
  for (let item of cases) {
    for (let item1 of cases) {
      returnValue.push({
        second: item1,
        first: item,
      })
    }
  }
  return returnValue
}
