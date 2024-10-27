import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { getCommentAfter } from './get-comment-after'
import { getNodeRange } from './get-node-range'

export let makeFixes = (
  fixer: TSESLint.RuleFixer,
  nodes: SortingNode[],
  sortedNodes: SortingNode[],
  sourceCode: TSESLint.SourceCode,
  additionalOptions?: {
    partitionByComment: string[] | boolean | string
    matcher: 'minimatch' | 'regex'
  },
) => {
  let fixes: TSESLint.RuleFix[] = []

  let isSingleline =
    nodes.at(0)?.node.loc.start.line === nodes.at(-1)?.node.loc.end.line

  for (let max = nodes.length, i = 0; i < max; i++) {
    let sortingNode = nodes.at(i)!
    let sortedSortingNode = sortedNodes.at(i)!
    let { node } = sortingNode
    let { node: sortedNode } = sortedSortingNode

    if (node !== sortedNode) {
      let sortedNodeCode = sourceCode.text.slice(
        ...getNodeRange(sortedNode, sourceCode, additionalOptions),
      )
      let sortedNodeText = sourceCode.getText(sortedNode)
      let tokensAfter = sourceCode.getTokensAfter(node, {
        includeComments: false,
        count: 1,
      })
      let nextToken = tokensAfter.at(0)
      if (
        !sortedNodeText.endsWith(';') &&
        !sortedNodeText.endsWith(',') &&
        sortedSortingNode.addSafetySemicolonWhenInline &&
        nextToken &&
        node.loc.start.line === nextToken.loc.start.line &&
        nextToken.value !== ';' &&
        nextToken.value !== ','
      ) {
        sortedNodeCode += ';'
      }
      fixes.push(
        fixer.replaceTextRange(
          getNodeRange(node, sourceCode, additionalOptions),
          sortedNodeCode,
        ),
      )
    }

    let commentAfter = getCommentAfter(sortedNodes.at(i)!.node, sourceCode)

    if (commentAfter && !isSingleline) {
      let tokenBefore = sourceCode.getTokenBefore(commentAfter)

      let range: TSESTree.Range = [
        tokenBefore!.range.at(1)!,
        commentAfter.range.at(1)!,
      ]

      fixes.push(fixer.replaceTextRange(range, ''))

      let tokenAfterNode = sourceCode.getTokenAfter(node)

      fixes.push(
        fixer.insertTextAfter(
          tokenAfterNode?.loc.end.line === node.loc.end.line
            ? tokenAfterNode
            : node,
          sourceCode.text.slice(...range),
        ),
      )
    }
  }

  return fixes
}
