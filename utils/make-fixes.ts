import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { makeCommentAfterFixes } from './make-comment-after-fixes'
import { getNodeRange } from './get-node-range'

interface MakeFixesParameters {
  options?: {
    partitionByComment: string[] | boolean | string
  }
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  fixer: TSESLint.RuleFixer
  nodes: SortingNode[]
}

export let makeFixes = ({
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeFixesParameters): TSESLint.RuleFix[] => {
  let fixes: TSESLint.RuleFix[] = []

  for (let max = nodes.length, i = 0; i < max; i++) {
    let sortingNode = nodes.at(i)!
    let sortedSortingNode = sortedNodes.at(i)!
    let { node } = sortingNode
    let { addSafetySemicolonWhenInline, node: sortedNode } = sortedSortingNode

    if (node === sortedNode) {
      continue
    }

    let sortedNodeCode = sourceCode.text.slice(
      ...getNodeRange({
        node: sortedNode,
        sourceCode,
        options,
      }),
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
      addSafetySemicolonWhenInline &&
      isNextTokenOnSameLineAsNode &&
      !sortedNextNodeEndsWithSafeCharacter &&
      !isNextTokenSafeCharacter
    ) {
      sortedNodeCode += ';'
    }
    fixes.push(
      fixer.replaceTextRange(
        getNodeRange({ sourceCode, options, node }),
        sortedNodeCode,
      ),
    )
    fixes = [
      ...fixes,
      ...makeCommentAfterFixes({
        sortedNode,
        sourceCode,
        fixer,
        node,
      }),
    ]
  }

  return fixes
}
