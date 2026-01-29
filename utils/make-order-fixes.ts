import type { TSESLint } from '@typescript-eslint/utils'

import type { CommonPartitionOptions } from '../types/common-partition-options'
import type { SortingNode } from '../types/sorting-node'

import { getNodeRange } from './get-node-range'

/**
 * Parameters for generating order fixes.
 */
interface MakeOrderFixesParameters {
  /**
   * Optional configuration options.
   */
  options?: Pick<CommonPartitionOptions, 'partitionByComment'>

  /**
   * Whether to ignore the highest block comment for the first node. Useful for
   * preserving file-level documentation comments.
   */
  ignoreFirstNodeHighestBlockComment?: boolean

  /**
   * ESLint source code object for accessing text and ranges.
   */
  sourceCode: TSESLint.SourceCode

  /**
   * Array of nodes in their sorted order.
   */
  sortedNodes: SortingNode[]

  /**
   * ESLint fixer object for creating fix operations.
   */
  fixer: TSESLint.RuleFixer

  /**
   * Array of nodes in their original order.
   */
  nodes: SortingNode[]
}

/**
 * Generates fixes for reordering nodes to their sorted positions.
 *
 * Creates text replacement fixes that swap node positions to achieve the
 * desired sort order. The function handles several important edge cases:
 *
 * - Preserves leading comments and documentation
 * - Maintains file-level block comments for the first node
 * - Adds safety semicolons when needed to prevent ASI issues
 * - Respects partition boundaries defined by comments.
 *
 * The function iterates through each node position and replaces the original
 * node text with the text from the node that should be in that position
 * according to the sorted order.
 *
 * @example
 *
 * ```ts
 * // Original order:
 * const b = 2
 * const a = 1
 *
 * // After applying order fixes:
 * const a = 1
 * const b = 2
 * ```
 *
 * @example
 *
 * ```ts
 * // Safety semicolon example
 * // Original:
 * const b = 2
 * const a = 1 // 'a' will move to first position
 *
 * // After fix (semicolon added to prevent ASI issues):
 * const a = 1
 * const b = 2
 * ```
 *
 * @param params - Parameters for generating order fixes.
 * @returns Array of ESLint fix operations to reorder nodes.
 */
export function makeOrderFixes({
  ignoreFirstNodeHighestBlockComment,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeOrderFixesParameters): TSESLint.RuleFix[] {
  let fixes: TSESLint.RuleFix[] = []

  for (let max = nodes.length, i = 0; i < max; i++) {
    let sortingNode = nodes.at(i)!
    let sortedSortingNode = sortedNodes.at(i)!
    let { node } = sortingNode
    let { addSafetySemicolonWhenInline, node: sortedNode } = sortedSortingNode
    let isNodeFirstNode = node === nodes.at(0)!.node
    let isSortedNodeFirstNode = sortedNode === nodes.at(0)!.node

    if (node === sortedNode) {
      continue
    }

    let sortedNodeCode = sourceCode.text.slice(
      ...getNodeRange({
        ignoreHighestBlockComment:
          ignoreFirstNodeHighestBlockComment && isSortedNodeFirstNode,
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
        getNodeRange({
          ignoreHighestBlockComment:
            ignoreFirstNodeHighestBlockComment && isNodeFirstNode,
          sourceCode,
          options,
          node,
        }),
        sortedNodeCode,
      ),
    )
  }

  return fixes
}
