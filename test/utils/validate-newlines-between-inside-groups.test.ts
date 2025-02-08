import { describe, expect, it } from 'vitest'

import { validateNewlinesBetweenInsideGroups } from '../../utils/validate-newlines-between-inside-groups'

describe('validate-newlines-between-inside-groups', () => {
  it('throws an error with consecutive newlines objects', () => {
    expect(() => {
      validateNewlinesBetweenInsideGroups({
        groups: [{ newlinesBetween: 'always' }, { newlinesBetween: 'always' }],
      })
    }).toThrow("Consecutive 'newlinesBetween' objects are not allowed")
  })
})
