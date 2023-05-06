import type {
  RuleFixer,
  RuleFix,
} from '@typescript-eslint/utils/dist/ts-eslint/index.js'
import type {
  Range,
  Node,
} from '@typescript-eslint/types/dist/generated/ast-spec'

import type { SortingNode } from '~/typings'

export let sortNodes = (
  fixer: RuleFixer,
  source: string,
  nodes: SortingNode[],
): RuleFix[] => {
  let sortedNodes = [...nodes].sort((a, b) => b.size - a.size)

  let getNodeRange = (node: Node): Range => [
    node.range.at(0)!,
    node.range.at(1)!,
  ]

  return nodes.map(({ node }, index) =>
    fixer.replaceTextRange(
      getNodeRange(node),
      source.slice(...getNodeRange(sortedNodes[index].node)),
    ),
  )
}
