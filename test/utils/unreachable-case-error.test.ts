import { describe, expect, it } from 'vitest'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

describe('unreachable-case-error', () => {
  it('should construct the error with the correct message', () => {
    expect(() => {
      throw new UnreachableCaseError('Case that could not be reached' as never)
    }).toThrow('Unreachable case: Case that could not be reached')
  })
})
