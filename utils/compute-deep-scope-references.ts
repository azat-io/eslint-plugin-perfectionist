import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

/**
 * Recursively computes all scope references deeply for a given node.
 *
 * @param node - The AST node.
 * @param sourceCode - The source code object.
 * @returns The list of scope references.
 */
export function computeDeepScopeReferences(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): TSESLint.Scope.Reference[] {
  return computeScopeReference(sourceCode.getScope(node))

  function computeScopeReference(
    scope: TSESLint.Scope.Scope,
  ): TSESLint.Scope.Reference[] {
    return [
      ...scope.references,
      ...scope.childScopes.flatMap(computeScopeReference),
    ]
  }
}
