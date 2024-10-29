import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { makeCommentAfterFixes } from './make-comment-after-fixes'
import { getNodeRange } from './get-node-range'

export const makeFixes = (
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

  for (let max = nodes.length, i = 0; i < max; i++) {
    let sortingNode = nodes.at(i)!
    let sortedSortingNode = sortedNodes.at(i)!
    let { node } = sortingNode
    let { node: sortedNode } = sortedSortingNode

    if (node === sortedNode) {
      continue
    }

    let sortedNodeCode = sourceCode.text.slice(
      ...getNodeRange(sortedNode, sourceCode, additionalOptions),
    )
    let sortedNodeText = sourceCode.getText(sortedNode)
    let tokensAfter = sourceCode.getTokensAfter(node, {
      includeComments: false,
      count: 1,
    })
    let nextToken = tokensAfter.at(0)

    let sortedNextNodeEndsWithSafeCharacter =
      sortedNodeText.endsWith(';') || sortedNodeText.endsWith(',')
    let isNextTokenOnSameLineAsNode =
      nextToken?.loc.start.line === node.loc.end.line
    let isNextTokenSafeCharacter =
      nextToken?.value === ';' || nextToken?.value === ','
    if (
      sortedSortingNode.addSafetySemicolonWhenInline &&
      isNextTokenOnSameLineAsNode &&
      !sortedNextNodeEndsWithSafeCharacter &&
      !isNextTokenSafeCharacter
    ) {
      sortedNodeCode += ';'
    }
    fixes.push(
      fixer.replaceTextRange(
        getNodeRange(node, sourceCode, additionalOptions),
        sortedNodeCode,
      ),
    )
    fixes = [
      ...fixes,
      ...makeCommentAfterFixes(fixer, node, sortedNode, sourceCode),
    ]
  }

  return fixes
}
