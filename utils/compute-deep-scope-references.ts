import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

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
