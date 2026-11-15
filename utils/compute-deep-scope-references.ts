import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { rangeContainsRange } from './range-contains-range'

/**
 * Recursively computes the scope references located within the given nodes.
 *
 * Each scope is visited once, and child scopes outside the nodes are skipped.
 *
 * @param nodes - The AST nodes.
 * @param sourceCode - The source code object.
 * @returns The list of unique scope references within the nodes.
 */
export function computeDeepScopeReferences(
  nodes: TSESTree.Node[],
  sourceCode: TSESLint.SourceCode,
): TSESLint.Scope.Reference[] {
  let nodesRange = computeNodesRange(nodes)
  let visitedScopes = new Set<TSESLint.Scope.Scope>()
  let references: TSESLint.Scope.Reference[] = []
  for (let node of nodes) {
    collectScopeReferences(computeDeclarationScope(node, sourceCode))
  }
  return references

  /**
   * Collects the references of a scope and its overlapping child scopes.
   *
   * @param scope - The scope to visit.
   */
  function collectScopeReferences(scope: TSESLint.Scope.Scope): void {
    if (visitedScopes.has(scope)) {
      return
    }
    visitedScopes.add(scope)
    for (let reference of scope.references) {
      if (rangeContainsRange(nodesRange, reference.identifier.range)) {
        references.push(reference)
      }
    }
    for (let childScope of scope.childScopes) {
      if (doRangesOverlap(nodesRange, childScope.block.range)) {
        collectScopeReferences(childScope)
      }
    }
  }
}

/**
 * Computes the range spanning all the given nodes.
 *
 * @param nodes - The AST nodes.
 * @returns The range from the first node start to the last node end.
 */
function computeNodesRange(nodes: TSESTree.Node[]): TSESTree.Range {
  let start = Infinity
  let end = -Infinity
  for (let node of nodes) {
    start = Math.min(start, node.range[0])
    end = Math.max(end, node.range[1])
  }
  return [start, end]
}

/**
 * Computes the scope in which a node is declared.
 *
 * A node that creates its own scope, such as a class, can still hold references
 * that belong to the upper scope, such as those in its decorators.
 *
 * @param node - The AST node.
 * @param sourceCode - The source code object.
 * @returns The scope in which the node is declared.
 */
function computeDeclarationScope(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): TSESLint.Scope.Scope {
  let scope = sourceCode.getScope(node)
  if (scope.block === node && scope.upper) {
    return scope.upper
  }
  return scope
}

/**
 * Checks whether two ranges share at least one character.
 *
 * @param range - The first range.
 * @param otherRange - The second range.
 * @returns True if the ranges overlap.
 */
function doRangesOverlap(
  range: TSESTree.Range,
  otherRange: TSESTree.Range,
): boolean {
  return range[0] < otherRange[1] && otherRange[0] < range[1]
}
