import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { getComment } from '~/utils/get-comment'

export let getNodeRange = (
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): TSESTree.Range => {
  let comment = getComment(node, sourceCode)
  return [comment?.range.at(0) ?? node.range.at(0)!, node.range.at(1)!]
}
