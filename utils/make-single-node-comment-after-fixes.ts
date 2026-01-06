import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

/** Parameters for generating comment-after fixes for a single node. */
interface MakeSingleNodeCommentAfterFixesParameters {
  /** The node in its sorted position. */
  sortedNode: TSESTree.Token | TSESTree.Node

  /** The node in its original position. */
  node: TSESTree.Token | TSESTree.Node

  /** ESLint source code object for accessing comments and tokens. */
  sourceCode: TSESLint.SourceCode

  /** ESLint fixer object for creating fix operations. */
  fixer: TSESLint.RuleFixer
}

/**
 * Generates fixes to move inline trailing comments with their associated nodes.
 *
 * When a node is moved during sorting, this function ensures that any inline
 * comment on the same line (trailing comment) is moved along with it. This
 * preserves the relationship between code and its inline documentation.
 *
 * The function:
 *
 * - Detects inline comments after the sorted node
 * - Skips processing if nodes would end up on the same line
 * - Removes the comment from its original position
 * - Inserts it after the node's new position.
 *
 * @example
 *   // Original:
 *   const b = 2 // second value
 *   const a = 1 // first value
 *
 *   // After sorting (with comment fixes):
 *   const a = 1 // first value
 *   const b = 2 // second value
 *
 * @param params - Parameters for generating comment fixes.
 * @returns Array of ESLint fix operations, empty if no inline comment exists.
 */
export function makeSingleNodeCommentAfterFixes({
  sortedNode,
  sourceCode,
  fixer,
  node,
}: MakeSingleNodeCommentAfterFixesParameters): TSESLint.RuleFix[] {
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

/**
 * Retrieves an inline comment that appears after a node on the same line.
 *
 * Searches for a comment token that:
 *
 * - Appears after the given node
 * - Is on the same line as the node's end
 * - Skips over punctuation like commas, semicolons, and colons.
 *
 * This helps identify inline trailing comments that should move with the node
 * during sorting operations.
 *
 * @param node - The node to check for trailing comments.
 * @param source - ESLint source code object.
 * @returns The inline comment if found, null otherwise.
 */
function getCommentAfter(
  node: TSESTree.Token | TSESTree.Node,
  source: TSESLint.SourceCode,
): TSESTree.Comment | null {
  let token = source.getTokenAfter(node, {
    filter: ({ value, type }) =>
      type !== 'Punctuator' || ![',', ';', ':'].includes(value),
    includeComments: true,
  })

  if (
    (token?.type === 'Block' || token?.type === 'Line') &&
    node.loc.end.line === token.loc.end.line
  ) {
    return token
  }

  return null
}
