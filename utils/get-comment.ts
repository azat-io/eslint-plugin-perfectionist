import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_TOKEN_TYPES } from '@typescript-eslint/types'

export let getComment = (
  node: TSESTree.Node,
  source: TSESLint.SourceCode,
): TSESTree.Comment | null => {
  let previousTokenOrComment = source.getTokenBefore(node, {
    includeComments: true,
  })

  if (
    (previousTokenOrComment?.type === AST_TOKEN_TYPES.Block ||
      previousTokenOrComment?.type === AST_TOKEN_TYPES.Line) &&
    node.loc.start.line - previousTokenOrComment.loc.end.line <= 1
  ) {
    return previousTokenOrComment
  }

  return null
}
