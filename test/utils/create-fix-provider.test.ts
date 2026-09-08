import type { TSESLint } from '@typescript-eslint/utils'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SortingNode } from '../../types/sorting-node'

import { createFixProvider } from '../../utils/create-fix-provider'
import { makeFixes } from '../../utils/make-fixes'

vi.mock('../../utils/make-fixes', () => ({ makeFixes: vi.fn() }))

describe('create-fix-provider', () => {
  beforeEach(() => {
    vi.mocked(makeFixes).mockReset()
  })

  it('builds the fix once and returns the same value on every call', () => {
    vi.mocked(makeFixes).mockReturnValue([
      { range: [2, 4], text: 'A' },
      { range: [6, 8], text: 'B' },
    ] as TSESLint.RuleFix[])
    let getFix = createFixProvider(getMakeFixesParameters())

    let firstFix = getFix({ hasCommentAboveMissing: false, fixer })
    let secondFix = getFix({ hasCommentAboveMissing: false, fixer })

    expect(secondFix).toBe(firstFix)
    expect(makeFixes).toHaveBeenCalledExactlyOnceWith({
      ...getMakeFixesParameters(),
      hasCommentAboveMissing: false,
      fixer,
    })
  })

  it('caches an empty fix list instead of rebuilding it', () => {
    vi.mocked(makeFixes).mockReturnValue([])
    let getFix = createFixProvider(getMakeFixesParameters())

    let firstFix = getFix({ hasCommentAboveMissing: false, fixer })
    let secondFix = getFix({ hasCommentAboveMissing: false, fixer })

    expect(secondFix).toBe(firstFix)
    expect(makeFixes).toHaveBeenCalledExactlyOnceWith({
      ...getMakeFixesParameters(),
      hasCommentAboveMissing: false,
      fixer,
    })
  })

  it('keeps a separate slot for each hasCommentAboveMissing value', () => {
    vi.mocked(makeFixes)
      .mockReturnValueOnce([{ range: [0, 1], text: 'A' }] as TSESLint.RuleFix[])
      .mockReturnValueOnce([{ range: [2, 3], text: 'B' }] as TSESLint.RuleFix[])
    let getFix = createFixProvider(getMakeFixesParameters())

    let withoutComment = getFix({ hasCommentAboveMissing: false, fixer })
    let withComment = getFix({ hasCommentAboveMissing: true, fixer })

    expect(makeFixes).toHaveBeenCalledTimes(2)
    expect(withoutComment).toEqual([{ range: [0, 1], text: 'A' }])
    expect(withComment).toEqual([{ range: [2, 3], text: 'B' }])
  })

  let fixer = {} as TSESLint.RuleFixer

  function getMakeFixesParameters(): {
    sourceCode: TSESLint.SourceCode
    sortedNodes: SortingNode[]
    nodes: SortingNode[]
  } {
    return {
      sourceCode: { text: '0123456789' } as unknown as TSESLint.SourceCode,
      sortedNodes: [],
      nodes: [],
    }
  }
})
