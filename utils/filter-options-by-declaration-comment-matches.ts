import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { RegexOption } from '../types/common-options'

import { matches } from './matches'

interface Options {
  useConfigurationIf?: {
    declarationCommentMatchesPattern?: RegexOption
  }
}

export function filterOptionsByDeclarationCommentMatches<T extends Options>({
  contextOptions,
  sourceCode,
  parentNode,
}: {
  parentNode: TSESTree.Node | null
  sourceCode: TSESLint.SourceCode
  contextOptions: T[]
}): T[] {
  return contextOptions.filter(options => {
    if (!options.useConfigurationIf?.declarationCommentMatchesPattern) {
      return true
    }

    if (!parentNode) {
      return false
    }

    let { declarationCommentMatchesPattern } = options.useConfigurationIf
    let parentComment = sourceCode.getCommentsBefore(parentNode)

    return parentComment.some(comment =>
      matches(comment.value.trim(), declarationCommentMatchesPattern),
    )
  })
}
