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
}: MakeOrderAndCommentsAfterFixesParameters): TSESLint.RuleFix[] => {
  let fixes: TSESLint.RuleFix[] = makeOrderFixes({
    ignoreFirstNodeHighestBlockComment,
    sortedNodes,
    sourceCode,
    options,
    fixer,
    nodes,
  })

  for (let max = nodes.length, i = 0; i < max; i++) {
    let sortingNode = nodes.at(i)!
    let sortedSortingNode = sortedNodes.at(i)!
    let { node } = sortingNode
    let { node: sortedNode } = sortedSortingNode

    if (node === sortedNode) {
      continue
    }

    fixes = [
      ...fixes,
      ...makeCommentAfterFixes({
        sortedNode,
        sourceCode,
        fixer,
        node,
      }),
    ]
  }

  return fixes
}
