import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { RegexOption } from '../types/common-options'

import { computeParentNodesWithTypes } from './compute-parent-nodes-with-types'
import { isNodeImmediatelyCalled } from './is-node-immediately-called'
import { matches } from './matches'

/**
 * Checks whether a node sits inside a function body that is deferred.
 *
 * Used to distinguish between references that are evaluated immediately (like
 * IIFEs or synchronous callbacks) and those whose execution is delayed (like
 * assigned functions or explicitly ignored callback wrappers).
 *
 * @param params - The parameters object.
 * @param params.ignoreCallbackDependenciesPatterns - Optional regex pattern to
 *   explicitly treat matching callback wrappers as deferred.
 * @param params.maxParent - Maximum exclusive parent node to stop the search
 *   at.
 * @param params.node - The AST node whose enclosing functions are inspected.
 * @returns Whether the node lives inside a deferred function.
 */
export function isNodeInsideDeferredFunction({
  ignoreCallbackDependenciesPatterns,
  maxParent,
  node,
}: {
  ignoreCallbackDependenciesPatterns?: RegexOption
  maxParent: TSESTree.Node
  node: TSESTree.Node
}): boolean {
  if (
    ignoreCallbackDependenciesPatterns &&
    matchesIgnoreCallbackDependencyPattern({
      ignoreCallbackDependenciesPatterns,
      maxParent,
      node,
    })
  ) {
    return true
  }

  let functionParentNodes = computeParentNodesWithTypes({
    allowedTypes: [
      AST_NODE_TYPES.FunctionExpression,
      AST_NODE_TYPES.ArrowFunctionExpression,
    ],
    consecutiveOnly: false,
    maxParent,
    node,
  })

  return functionParentNodes.some(isFunctionDeferred)
}

function matchesIgnoreCallbackDependencyPattern({
  ignoreCallbackDependenciesPatterns,
  maxParent,
  node,
}: {
  ignoreCallbackDependenciesPatterns: RegexOption
  maxParent: TSESTree.Node
  node: TSESTree.Node
}): boolean {
  let callExpressionParents = computeParentNodesWithTypes({
    allowedTypes: [AST_NODE_TYPES.CallExpression],
    consecutiveOnly: false,
    maxParent,
    node,
  })

  return callExpressionParents.some(
    callExpressionMatchesCallbackDependencyPattern,
  )

  function callExpressionMatchesCallbackDependencyPattern(
    callExpression: TSESTree.CallExpression,
  ): boolean {
    return (
      'name' in callExpression.callee &&
      matches(callExpression.callee.name, ignoreCallbackDependenciesPatterns)
    )
  }
}

function isFunctionDeferred(
  functionNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
): boolean {
  let { parent } = functionNode

  if (isNodeImmediatelyCalled(functionNode)) {
    return false
  }

  return parent.type !== AST_NODE_TYPES.CallExpression
}
