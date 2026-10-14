import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

/**
 * Recursively computes all scope references deeply for the given nodes.
 *
 * Each scope is visited once, even when several nodes share it or one node's
 * scope contains another's.
 *
 * @param nodes - The AST nodes.
 * @param sourceCode - The source code object.
 * @returns The list of unique scope references.
 */
export function computeDeepScopeReferences(
  nodes: TSESTree.Node[],
  sourceCode: TSESLint.SourceCode,
): TSESLint.Scope.Reference[] {
  let visitedScopes = new Set<TSESLint.Scope.Scope>()
  let references: TSESLint.Scope.Reference[] = []
  for (let node of nodes) {
    collectScopeReferences(sourceCode.getScope(node))
  }
  return references

  function collectScopeReferences(scope: TSESLint.Scope.Scope): void {
    if (visitedScopes.has(scope)) {
      return
    }
    visitedScopes.add(scope)
    for (let reference of scope.references) {
      references.push(reference)
    }
    for (let childScope of scope.childScopes) {
      collectScopeReferences(childScope)
    }
  }
}
