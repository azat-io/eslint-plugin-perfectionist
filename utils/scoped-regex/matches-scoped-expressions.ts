import type { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { ScopedRegexOption } from '../../types/scoped-regex-option'
import type { SingleRegexOption } from './partition-patterns-by-scope'
import type { NodeOfType } from '../../types/node-of-type'

import { partitionPatternsByScope } from './partition-patterns-by-scope'
import { matches } from '../matches'

export type NodeValuesComputer<T extends AST_NODE_TYPES> = (
  node: NodeOfType<T>,
) => string[]

/**
 * Checks whether any of the parent nodes match the scoped regex patterns.
 *
 * @param params - The parameters object.
 * @param params.nodeValuesComputer - Function to compute the string values of a
 *   node to match against.
 * @param params.scopedRegexOption - The scoped regex option to match against.
 * @param params.allowedNodeTypes - The set of allowed node types to consider.
 * @param params.parentNodes - The parent nodes to check.
 * @returns True if any parent node matches the scoped regex patterns, false
 *   otherwise.
 */
export function matchesScopedExpressions<T extends AST_NODE_TYPES>({
  nodeValuesComputer,
  scopedRegexOption,
  allowedNodeTypes,
  parentNodes,
}: {
  scopedRegexOption: ScopedRegexOption | undefined
  nodeValuesComputer: NodeValuesComputer<T>
  parentNodes: TSESTree.Node[]
  allowedNodeTypes: Set<T>
}): boolean {
  if (!scopedRegexOption) {
    return true
  }

  let { shallowScopePatterns, deepScopePatterns } =
    partitionPatternsByScope(scopedRegexOption)

  return (
    matchesShallowScopedExpressions({
      patterns: shallowScopePatterns,
      nodeValuesComputer,
      allowedNodeTypes,
      parentNodes,
    }) ||
    matchesDeepScopedExpressions({
      patterns: deepScopePatterns,
      nodeValuesComputer,
      allowedNodeTypes,
      parentNodes,
    })
  )
}

function matchesShallowScopedExpressions<T extends AST_NODE_TYPES>({
  nodeValuesComputer,
  allowedNodeTypes,
  parentNodes,
  patterns,
}: {
  nodeValuesComputer: NodeValuesComputer<T>
  patterns: SingleRegexOption[]
  parentNodes: TSESTree.Node[]
  allowedNodeTypes: Set<T>
}): boolean {
  let [firstParent] = parentNodes
  // v8 ignore if -- @preserve Unsure how we can reach that case
  if (!firstParent) {
    return false
  }

  if (!isNodeTypeAmong(firstParent, allowedNodeTypes)) {
    return false
  }

  return matchesParentExpression({
    parentNode: firstParent,
    nodeValuesComputer,
    patterns,
  })
}

function matchesDeepScopedExpressions<T extends AST_NODE_TYPES>({
  nodeValuesComputer,
  allowedNodeTypes,
  parentNodes,
  patterns,
}: {
  nodeValuesComputer: NodeValuesComputer<T>
  patterns: SingleRegexOption[]
  parentNodes: TSESTree.Node[]
  allowedNodeTypes: Set<T>
}): boolean {
  let relevantParentNodes = parentNodes.filter(parent =>
    isNodeTypeAmong(parent, allowedNodeTypes),
  )

  return relevantParentNodes.some(parentNode =>
    matchesParentExpression({
      nodeValuesComputer,
      parentNode,
      patterns,
    }),
  )
}

function matchesParentExpression<T extends AST_NODE_TYPES>({
  nodeValuesComputer,
  parentNode,
  patterns,
}: {
  nodeValuesComputer: NodeValuesComputer<T>
  patterns: SingleRegexOption[]
  parentNode: NodeOfType<T>
}): boolean {
  let nodeValues = nodeValuesComputer(parentNode)

  return patterns.some(nodeValueMatchesPattern)

  function nodeValueMatchesPattern(pattern: SingleRegexOption): boolean {
    return nodeValues.some(nodeValue => matches(nodeValue, pattern))
  }
}

function isNodeTypeAmong<T extends AST_NODE_TYPES>(
  node: TSESTree.Node,
  types: Set<T>,
): node is NodeOfType<T> {
  return types.has(node.type as T)
}
