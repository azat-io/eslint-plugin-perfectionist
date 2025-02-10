import { describe, expect, it } from 'vitest'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

describe('unreachable-case-error', () => {
  it('should throw the correct error message', () => {
    expect(() => {
      throw new UnreachableCaseError('unexpected value' as never)
    }).toThrow(
      'Unexpected case: unexpected value. Please report this issue: https://github.com/azat-io/eslint-plugin-perfectionist/issues',
    )
  })
})
