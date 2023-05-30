import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode, SortType, SortOrder } from '~/typings'
import { getNodeRange } from '~/utils/get-node-range'
import { compare } from '~/utils/compare'

export let sortNodes = (
  fixer: TSESLint.RuleFixer,
  {
    options,
    source,
    nodes,
  }: {
    nodes: SortingNode[]
    source: TSESLint.SourceCode
    options: {
      spreadLast?: boolean
      order: SortOrder
      type: SortType
    }
  },
): TSESLint.RuleFix[] => {
  let sortedNodes = [...nodes].sort(
    (a, b) => Number(compare(a, b, options)) || -1,
  )

  if (options.spreadLast) {
    sortedNodes.forEach((sortedNode, index) => {
      if (sortedNode.node.type === AST_NODE_TYPES.SpreadElement) {
        sortedNodes.push(sortedNodes.splice(index, 1).at(0)!)
      }
    })
  }

  return nodes.map(({ node }, index) =>
    fixer.replaceTextRange(
      getNodeRange(node, source),
      source.text.slice(...getNodeRange(sortedNodes[index].node, source)),
    ),
  )
}
