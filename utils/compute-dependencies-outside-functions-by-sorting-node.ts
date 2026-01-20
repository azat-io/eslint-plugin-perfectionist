import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { ShouldIgnoreIdentifierComputer } from './compute-dependencies-by-sorting-node'
import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

import { computeDependenciesBySortingNode } from './compute-dependencies-by-sorting-node'
import { computeParentNodesWithTypes } from './compute-parent-nodes-with-types'

export function computeDependenciesOutsideFunctionsBySortingNode<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  sortingNodes,
  sourceCode,
}: {
  sourceCode: TSESLint.SourceCode
  sortingNodes: T[]
}): Map<T, T[]> {
  return computeDependenciesBySortingNode({
    shouldIgnoreIdentifierComputer: buildShouldIgnoreIdentifierComputer(),
    sortingNodes,
    sourceCode,
  })

  function buildShouldIgnoreIdentifierComputer(): ShouldIgnoreIdentifierComputer<T> {
    return ({ referencingSortingNode, identifier }) => {
      let ignoredParentNodes = computeParentNodesWithTypes({
        allowedTypes: [
          AST_NODE_TYPES.FunctionExpression,
          AST_NODE_TYPES.ArrowFunctionExpression,
        ],
        maxParent: referencingSortingNode.node,
        consecutiveOnly: false,
        node: identifier,
      })

      return ignoredParentNodes.length > 0
    }
  }
}
