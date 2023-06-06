import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'
import type { SortingNode } from '../typings'

import { getCommentAfter } from './get-comment-after'
import { getNodeRange } from './get-node-range'

export let makeFixes = (
  fixer: TSESLint.RuleFixer,
  nodes: SortingNode[],
  sortedNodes: SortingNode[],
  source: TSESLint.SourceCode,
) => {
  let fixes: TSESLint.RuleFix[] = []

  nodes.forEach(({ node }, index) => {
    fixes.push(
      fixer.replaceTextRange(
        getNodeRange(node, source),
        source.text.slice(...getNodeRange(sortedNodes[index].node, source)),
      ),
    )

    let commentAfter = getCommentAfter(sortedNodes[index].node, source)

    if (commentAfter) {
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
  })
  return fixes
}
