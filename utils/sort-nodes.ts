import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode, SortType, SortOrder } from '~/typings'
import { compare } from '~/utils/compare'

export let sortNodes = (
  fixer: TSESLint.RuleFixer,
  source: string,
  nodes: SortingNode[],
  options: {
    spreadLast?: boolean
    order: SortOrder
    type: SortType
  },
): TSESLint.RuleFix[] => {
  let sortedNodes = [...nodes].sort((a, b) => Number(compare(a, b, options)) || -1)

  if (options.spreadLast) {
    sortedNodes.forEach((sortedNode, index) => {
      if (sortedNode.node.type === AST_NODE_TYPES.SpreadElement) {
        sortedNodes.push(sortedNodes.splice(index, 1).at(0)!)
      }
    })
  }

  let getNodeRange = (node: TSESTree.Node): TSESTree.Range => [node.range.at(0)!, node.range.at(1)!]

  return nodes.map(({ node }, index) =>
    fixer.replaceTextRange(getNodeRange(node), source.slice(...getNodeRange(sortedNodes[index].node))),
  )
}
