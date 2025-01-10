import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { makeCommentAfterFixes } from './make-comment-after-fixes'
import { makeOrderFixes } from './make-order-fixes'

interface MakeOrderAndCommentsAfterFixesParameters {
  options?: {
    partitionByComment:
      | {
          block?: string[] | boolean | string
          line?: string[] | boolean | string
        }
      | string[]
      | boolean
      | string
  }
  ignoreFirstNodeHighestBlockComment?: boolean
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  fixer: TSESLint.RuleFixer
  nodes: SortingNode[]
}

export let makeOrderAndCommentsAfterFixes = ({
  ignoreFirstNodeHighestBlockComment,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeOrderAndCommentsAfterFixesParameters): TSESLint.RuleFix[] => [
  ...makeOrderFixes({
    ignoreFirstNodeHighestBlockComment,
    sortedNodes,
    sourceCode,
    options,
    fixer,
    nodes,
  }),
  ...makeCommentAfterFixes({
    sortedNodes,
    sourceCode,
    nodes,
    fixer,
  }),
]
