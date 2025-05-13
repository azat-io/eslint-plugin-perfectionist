import { describe, expect, it } from 'vitest'

import { validateObjectsInsideGroups } from '../../utils/validate-objects-inside-groups'

describe('validate-objects-inside-groups', () => {
  it('throws an error with consecutive newlines objects', () => {
    expect(() => {
      validateObjectsInsideGroups({
        groups: [{ newlinesBetween: 'always' }, { newlinesBetween: 'always' }],
      })
    }).toThrow("Consecutive 'newlinesBetween' objects are not allowed")
  })
})
