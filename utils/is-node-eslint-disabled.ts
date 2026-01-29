import type { TSESTree } from '@typescript-eslint/types'

/**
 * Checks if ESLint rules are disabled for a specific AST node.
 *
 * Determines whether a node is located on a line where ESLint rules have been
 * disabled via comments (eslint-disable, eslint-disable-line,
 * eslint-disable-next-line). This is used to exclude disabled nodes from
 * sorting operations to respect user's explicit disable directives.
 *
 * @example
 *
 * ```ts
 * const eslintDisabledLines = [5, 10, 11, 12] // Lines where ESLint is disabled
 *
 * const nodeOnLine5 = { loc: { start: { line: 5 } } }
 * const nodeOnLine6 = { loc: { start: { line: 6 } } }
 *
 * isNodeEslintDisabled(nodeOnLine5, eslintDisabledLines)
 * // Returns: true (line 5 is in disabled lines)
 *
 * isNodeEslintDisabled(nodeOnLine6, eslintDisabledLines)
 * // Returns: false (line 6 is not in disabled lines)
 * ```
 *
 * @param node - AST node to check for ESLint disable status.
 * @param eslintDisabledLines - Array of line numbers where ESLint is disabled.
 * @returns True if the node is on a disabled line, false otherwise.
 */
export function isNodeEslintDisabled(
  node: TSESTree.Node,
  eslintDisabledLines: number[],
): boolean {
  return eslintDisabledLines.includes(node.loc.start.line)
}
