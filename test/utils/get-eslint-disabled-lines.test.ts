import type { TSESLint } from '@typescript-eslint/utils'

import { describe, expect, it } from 'vitest'

import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'

describe('getEslintDisabledLines', () => {
  it('returns empty array when getAllComments returns undefined', () => {
    expect(
      getEslintDisabledLines({
        sourceCode: getSourceCodeMock(undefined),
        ruleName: 'perfectionist/sort-imports',
      }),
    ).toStrictEqual([])
  })
})

function getSourceCodeMock(
  comments: undefined,
): TSESLint.SourceCode {
  return {
    getAllComments: () => comments,
  } as unknown as TSESLint.SourceCode
}
