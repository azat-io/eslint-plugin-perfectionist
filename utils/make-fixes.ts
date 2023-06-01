import type { TSESLint } from '@typescript-eslint/utils'
import type { SortingNode } from '../typings'

import { getNodeRange } from './get-node-range'

export let makeFixes = (
  fixer: TSESLint.RuleFixer,
  nodes: SortingNode[],
  sortedNodes: SortingNode[],
  source: TSESLint.SourceCode,
) =>
  nodes.map(({ node }, index) =>
    fixer.replaceTextRange(
      getNodeRange(node, source),
      source.text.slice(...getNodeRange(sortedNodes[index].node, source)),
    ),
  )
