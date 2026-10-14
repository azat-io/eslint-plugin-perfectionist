import type { TSESLint } from '@typescript-eslint/utils'

import { describe, expect, it } from 'vitest'

import { mergeFixes } from '../../utils/merge-fixes'

describe('merge-fixes', () => {
  it('returns an empty list unchanged', () => {
    let fixes: TSESLint.RuleFix[] = []

    expect(mergeFixes({ sourceCode: getSourceCodeMock(), fixes })).toBe(fixes)
  })

  it('returns a single-fix list unchanged', () => {
    let fixes = [{ range: [2, 4], text: 'A' }] as TSESLint.RuleFix[]

    expect(mergeFixes({ sourceCode: getSourceCodeMock(), fixes })).toBe(fixes)
  })

  it('merges out-of-order fixes and splices the original text into the gap', () => {
    let fixes = [
      { range: [6, 8], text: 'B' },
      { range: [2, 4], text: 'A' },
    ] as TSESLint.RuleFix[]

    expect(mergeFixes({ sourceCode: getSourceCodeMock(), fixes })).toEqual({
      range: [2, 8],
      text: 'A45B',
    })
  })

  it('orders fixes sharing a range start by their range end', () => {
    let fixes = [
      { range: [2, 6], text: 'B' },
      { range: [2, 2], text: 'A' },
    ] as TSESLint.RuleFix[]

    expect(mergeFixes({ sourceCode: getSourceCodeMock(), fixes })).toEqual({
      range: [2, 6],
      text: 'AB',
    })
  })

  it('returns overlapping fixes unchanged', () => {
    let fixes = [
      { range: [2, 6], text: 'A' },
      { range: [4, 8], text: 'B' },
    ] as TSESLint.RuleFix[]

    expect(mergeFixes({ sourceCode: getSourceCodeMock(), fixes })).toBe(fixes)
  })

  function getSourceCodeMock(): TSESLint.SourceCode {
    return { text: '0123456789' } as unknown as TSESLint.SourceCode
  }
})
