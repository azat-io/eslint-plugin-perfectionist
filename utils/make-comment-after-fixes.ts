import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { makeSingleNodeCommentAfterFixes } from './make-single-node-comment-after-fixes'

interface MakeCommentAfterFixesParameters {
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  fixer: TSESLint.RuleFixer
  nodes: SortingNode[]
}

export function makeCommentAfterFixes({
  sortedNodes,
  sourceCode,
  fixer,
  nodes,
}: MakeCommentAfterFixesParameters): TSESLint.RuleFix[] {
  let fixes: TSESLint.RuleFix[] = []
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
      ...makeSingleNodeCommentAfterFixes({
        sortedNode,
        sourceCode,
        fixer,
        node,
      }),
    ]
  }
  return fixes
}
