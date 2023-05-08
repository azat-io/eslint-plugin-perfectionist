import type { RuleFixer, RuleFix } from '@typescript-eslint/utils/dist/ts-eslint/index.js'
import type { Range, Node } from '@typescript-eslint/types/dist/generated/ast-spec'

import type { SortingNode, SortType, SortOrder } from '~/typings'
import { compare } from '~/utils/compare'

export let sortNodes = (
  fixer: RuleFixer,
  source: string,
  nodes: SortingNode[],
  options: {
    order: SortOrder
    type: SortType
  },
): RuleFix[] => {
  let sortedNodes = [...nodes].sort((a, b) => Number(compare(a, b, options)) || -1)

  let getNodeRange = (node: Node): Range => [node.range.at(0)!, node.range.at(1)!]

  return nodes.map(({ node }, index) =>
    fixer.replaceTextRange(getNodeRange(node), source.slice(...getNodeRange(sortedNodes[index].node))),
  )
}
