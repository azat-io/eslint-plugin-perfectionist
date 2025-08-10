import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

/**
 * Calculates the size of a node excluding trailing punctuation.
 *
 * Computes the character length of a node's text representation, automatically
 * subtracting trailing commas or semicolons from the size. This provides a more
 * accurate measure of the actual content size, which is useful for sorting by
 * line length.
 *
 * The function is widely used across all sorting rules when the sort type is
 * set to 'line-length', ensuring consistent size calculation that ignores
 * syntactic punctuation.
 *
 * @example
 *   // Node text: "const foo = 'bar';"
 *   rangeToDiff(node, sourceCode) // Returns: 17 (18 - 1 for semicolon)
 *
 * @example
 *   // Node text: "{ name: 'John', age: 30 },"
 *   rangeToDiff(node, sourceCode) // Returns: 26 (27 - 1 for comma)
 *
 * @example
 *   // Node text: "const value = 42"
 *   rangeToDiff(node, sourceCode) // Returns: 16 (no trailing punctuation)
 *
 * @param node - AST node to measure.
 * @param sourceCode - ESLint source code object for text extraction.
 * @returns Character count of the node excluding trailing comma or semicolon.
 */
export function rangeToDiff(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): number {
  let nodeText = sourceCode.getText(node)
  let endsWithCommaOrSemicolon =
    nodeText.endsWith(';') || nodeText.endsWith(',')
  let [from, to] = node.range
  return to - from - (endsWithCommaOrSemicolon ? 1 : 0)
}
