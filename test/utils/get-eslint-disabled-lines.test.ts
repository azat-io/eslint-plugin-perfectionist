import type { TSESLint } from '@typescript-eslint/utils'

import { describe, expect, it, vi } from 'vitest'

import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'

describe('getEslintDisabledLines', () => {
  let ruleName = 'perfectionist/sort-objects'

  it('computes disabled lines once per file and rule', () => {
    let sourceCode = buildSourceCodeMock(['eslint-disable-next-line'])

    let disabledLines = getEslintDisabledLines({ sourceCode, ruleName })
    let otherRuleDisabledLines = getEslintDisabledLines({
      ruleName: 'perfectionist/sort-imports',
      sourceCode,
    })

    expect(disabledLines).toStrictEqual(new Set([2]))
    expect(getEslintDisabledLines({ sourceCode, ruleName })).toBe(disabledLines)
    expect(otherRuleDisabledLines).not.toBe(disabledLines)
    expect(sourceCode.getAllComments).toHaveBeenCalledTimes(2)
  })

  it('does not reuse disabled lines across files sharing a source code object', () => {
    let sourceCode = buildSourceCodeMock(['eslint-disable-next-line'])

    expect(getEslintDisabledLines({ sourceCode, ruleName })).toStrictEqual(
      new Set([2]),
    )

    Object.assign(sourceCode, buildSourceCodeMock(['regular comment']))

    expect(getEslintDisabledLines({ sourceCode, ruleName })).toStrictEqual(
      new Set(),
    )
  })

  function buildSourceCodeMock(comments: string[]): TSESLint.SourceCode {
    let sourceCode: Partial<TSESLint.SourceCode> = {
      getAllComments: vi.fn().mockReturnValue(
        comments.map(value => ({
          loc: { start: { line: 1 }, end: { line: 1 } },
          value,
        })),
      ),
      ast: {} as TSESLint.SourceCode['ast'],
    }

    return sourceCode as TSESLint.SourceCode
  }
})
