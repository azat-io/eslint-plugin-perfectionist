import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { RegexOption } from '../types/common-options'

import { matches } from './matches'

interface Options {
  useConfigurationIf?: {
    declarationCommentMatchesPattern?: RegexOption
  }
}

export let filterOptionsByDeclarationCommentMatches = <T extends Options>({
  contextOptions,
  sourceCode,
  parentNode,
}: {
  sourceCode: TSESLint.SourceCode
  parentNode: TSESTree.Node
  contextOptions: T[]
  nodeNames: string[]
}): T[] =>
  contextOptions.filter(options => {
    if (!options.useConfigurationIf?.declarationCommentMatchesPattern) {
      return true
    }

    let { declarationCommentMatchesPattern } = options.useConfigurationIf
    let parentComment = sourceCode.getCommentsBefore(parentNode)

    return parentComment.some(comment =>
      matches(comment.value, declarationCommentMatchesPattern),
    )
  })
