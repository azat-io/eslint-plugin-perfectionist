import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

import { getDecoratorName } from '../../utils/get-decorator-name'

describe('get-decorator-name', () => {
  let decorator: TSESTree.Decorator = {} as TSESTree.Decorator

  it('returns the decorator name', () => {
    expect(
      getDecoratorName({
        sourceCode: getSourceCodeMock('decoratorName'),
        decorator,
      }),
    ).toBe('decoratorName')
  })

  it('trims "@" at the start', () => {
    expect(
      getDecoratorName({
        sourceCode: getSourceCodeMock('@decoratorName'),
        decorator,
      }),
    ).toBe('decoratorName')
  })

  it('stops at the first "("', () => {
    expect(
      getDecoratorName({
        sourceCode: getSourceCodeMock('A.B(() => C)'),
        decorator,
      }),
    ).toBe('A.B')
  })

  function getSourceCodeMock(decoratorName: string): TSESLint.SourceCode {
    return {
      getText: vi.fn().mockReturnValue(decoratorName),
    } as unknown as TSESLint.SourceCode
  }
})
