import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { getCommentAfter } from './get-comment-after'

interface MakeSingleNodeCommentAfterFixesParameters {
  sortedNode: TSESTree.Token | TSESTree.Node
  node: TSESTree.Token | TSESTree.Node
  sourceCode: TSESLint.SourceCode
  fixer: TSESLint.RuleFixer
}

export let makeSingleNodeCommentAfterFixes = ({
  sortedNode,
  sourceCode,
  fixer,
  node,
}: MakeSingleNodeCommentAfterFixesParameters): TSESLint.RuleFix[] => {
  let commentAfter = getCommentAfter(sortedNode, sourceCode)
  let areNodesOnSameLine = node.loc.start.line === sortedNode.loc.end.line
  if (!commentAfter || areNodesOnSameLine) {
    return []
  }

  let fixes: TSESLint.RuleFix[] = []
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

  return fixes
}
