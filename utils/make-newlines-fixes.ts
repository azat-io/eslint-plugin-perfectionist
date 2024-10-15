import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { getLinesBetween } from './get-lines-between'
import { getGroupNumber } from './get-group-number'
import { getNodeRange } from './get-node-range'

export const makeNewlinesFixes = (
  fixer: TSESLint.RuleFixer,
  nodes: SortingNode[],
  sortedNodes: SortingNode[],
  source: TSESLint.SourceCode,
  options: {
    newlinesBetween: 'ignore' | 'always' | 'never'
    groups: (string[] | string)[]
  },
) => {
  let fixes: TSESLint.RuleFix[] = []

  for (let max = sortedNodes.length, i = 0; i < max; i++) {
    let node = sortedNodes.at(i)!
    let nextNode = sortedNodes.at(i + 1)

    if (options.newlinesBetween === 'ignore' || !nextNode) {
      continue
    }

    let nodeGroupNumber = getGroupNumber(options.groups, node)
    let nextNodeGroupNumber = getGroupNumber(options.groups, nextNode)
    let currentNodeRange = getNodeRange(nodes.at(i)!.node, source)
    let nextNodeRange = getNodeRange(nodes.at(i + 1)!.node, source).at(0)! - 1

    let linesBetweenImports = getLinesBetween(
      source,
      nodes.at(i)!,
      nodes.at(i + 1)!,
    )

    if (
      (options.newlinesBetween === 'always' &&
        nodeGroupNumber === nextNodeGroupNumber &&
        linesBetweenImports !== 0) ||
      (options.newlinesBetween === 'never' && linesBetweenImports > 0)
    ) {
      fixes.push(fixer.removeRange([currentNodeRange.at(1)!, nextNodeRange]))
    }

    if (
      options.newlinesBetween === 'always' &&
      nodeGroupNumber !== nextNodeGroupNumber
    ) {
      if (linesBetweenImports > 1) {
        fixes.push(
          fixer.replaceTextRange(
            [currentNodeRange.at(1)!, nextNodeRange],
            '\n',
          ),
        )
      } else if (linesBetweenImports === 0) {
        fixes.push(fixer.insertTextAfterRange(currentNodeRange, '\n'))
      }
    }
  }
  return fixes
}
