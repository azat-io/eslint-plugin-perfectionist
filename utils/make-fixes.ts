import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { getCommentAfter } from './get-comment-after'
import { getNodeRange } from './get-node-range'

export let makeFixes = (
  fixer: TSESLint.RuleFixer,
  nodes: SortingNode[],
  sortedNodes: SortingNode[],
  source: TSESLint.SourceCode,
  additionalOptions?: {
    partitionByComment: string[] | boolean | string
    matcher: 'minimatch' | 'regex'
  },
) => {
  let fixes: TSESLint.RuleFix[] = []

  let isSingleline =
    nodes.at(0)?.node.loc.start.line === nodes.at(-1)?.node.loc.end.line

  for (let max = nodes.length, i = 0; i < max; i++) {
    let { node } = nodes.at(i)!

    fixes.push(
      fixer.replaceTextRange(
        getNodeRange(node, source, additionalOptions),
        source.text.slice(
          ...getNodeRange(sortedNodes.at(i)!.node, source, additionalOptions),
        ),
      ),
    )

    let commentAfter = getCommentAfter(sortedNodes.at(i)!.node, source)

    if (commentAfter && !isSingleline) {
      let tokenBefore = source.getTokenBefore(commentAfter)

      let range: TSESTree.Range = [
        tokenBefore!.range.at(1)!,
        commentAfter.range.at(1)!,
      ]

      fixes.push(fixer.replaceTextRange(range, ''))

      let tokenAfterNode = source.getTokenAfter(node)

      fixes.push(
        fixer.insertTextAfter(
          tokenAfterNode?.loc.end.line === node.loc.end.line
            ? tokenAfterNode
            : node,
          source.text.slice(...range),
        ),
      )
    }
  }

  return fixes
}
