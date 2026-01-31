import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { makeSingleNodeCommentAfterFixes } from './make-single-node-comment-after-fixes'

/**
 * Parameters for generating comment-after fixes.
 */
interface MakeCommentAfterFixesParameters {
  /**
   * ESLint source code object for accessing comments and tokens.
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
 * Generates fixes for handling inline trailing comments during sorting.
 *
 * Ensures that inline comments (comments on the same line after code) are
 * properly moved when their associated nodes are reordered during sorting. This
 * maintains the relationship between code and its inline comments.
 *
 * The function compares the original node positions with the sorted positions
 * and creates fixes only for nodes that have actually moved. For each moved
 * node, it delegates to `makeSingleNodeCommentAfterFixes` to handle the
 * specific comment adjustments.
 *
 * @example
 *
 * ```ts
 * // Original code:
 * const b = 2 // second value
 * const a = 1 // first value
 *
 * // After sorting (with comment fixes):
 * const a = 1 // first value
 * const b = 2 // second value
 *
 * // Comments stay with their associated nodes
 * ```
 *
 * @param params - Parameters for generating fixes.
 * @returns Array of ESLint fix operations to apply.
 */
export function makeCommentAfterFixes({
  sortedNodes,
  sourceCode,
  fixer,
  nodes,
}: MakeCommentAfterFixesParameters): TSESLint.RuleFix[] {
  let fixes: TSESLint.RuleFix[] = []
  for (let max = nodes.length, i = 0; i < max; i++) {
    let sortingNode = nodes.at(i)!
    let sortedSortingNode = sortedNodes.at(i)!
    let { node } = sortingNode
    let { node: sortedNode } = sortedSortingNode

    if (node === sortedNode) {
      continue
    }

    fixes.push(
      ...makeSingleNodeCommentAfterFixes({
        sortedNode,
        sourceCode,
        fixer,
        node,
      }),
    )
  }
  return fixes
}
