import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { describe, expect, it } from 'vitest'

import type { RegexOption } from '../../types/common-options'

import { filterOptionsByDeclarationCommentMatches } from '../../utils/filter-options-by-declaration-comment-matches'

describe('filter-options-by-declaration-comment-matches', () => {
  it('returns options with `declarationCommentMatchesPattern` undefined or empty', () => {
    let undefinedContextOptions = buildContextOptions()
    let emptyContextOptions = buildContextOptions('')
    let contextOptions = [undefinedContextOptions, emptyContextOptions]
    let sourceCode = mockSourceCodeWithComments([])

    expect(
      filterOptionsByDeclarationCommentMatches({
        parentNode: null,
        contextOptions,
        sourceCode,
      }),
    ).toEqual([undefinedContextOptions, emptyContextOptions])
  })

  it('filters out options where parentNode is null', () => {
    let contextOptions = [buildContextOptions('foo')]
    let sourceCode = mockSourceCodeWithComments([])

    expect(
      filterOptionsByDeclarationCommentMatches({
        parentNode: null,
        contextOptions,
        sourceCode,
      }),
    ).toEqual([])
  })

  it('returns options where the declaration comment matches `declarationCommentMatchesPattern`', () => {
    let barContextOptions = buildContextOptions('^A bar comment$')
    let contextOptions = [buildContextOptions('foo'), barContextOptions]
    let sourceCode = mockSourceCodeWithComments([
      'A non-matching comment',
      ' A bar comment ',
    ])

    expect(
      filterOptionsByDeclarationCommentMatches({
        parentNode: {} as TSESTree.Node,
        contextOptions,
        sourceCode,
      }),
    ).toEqual([barContextOptions])
  })

  function buildContextOptions(
    declarationCommentMatchesPattern?: RegexOption,
  ): {
    useConfigurationIf: { declarationCommentMatchesPattern?: RegexOption }
  } {
    return {
      useConfigurationIf: {
        ...(declarationCommentMatchesPattern
          ? { declarationCommentMatchesPattern }
          : {}),
      },
    }
  }

  function mockSourceCodeWithComments(comments: string[]): TSESLint.SourceCode {
    return {
      getCommentsBefore: () =>
        comments.map(comment => ({
          loc: null as unknown as TSESTree.SourceLocation,
          value: comment,
          range: [0, 0],
          type: 'Line',
        })),
    } as unknown as TSESLint.SourceCode
  }
})
