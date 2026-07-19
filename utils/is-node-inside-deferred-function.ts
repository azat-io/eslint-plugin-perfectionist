import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { computeParentNodesWithTypes } from './compute-parent-nodes-with-types'
import { isNodeImmediatelyCalled } from './is-node-immediately-called'

/**
 * Checks whether a node sits inside a function body that is not immediately
 * called.
 *
 * @param params - The parameters object.
 * @param params.node - The node whose enclosing functions are inspected.
 * @param params.maxParent - Maximum exclusive parent node to stop the search
 *   at.
 * @returns Whether the node lives inside a deferred function.
 */
export function isNodeInsideDeferredFunction({
  maxParent,
  node,
}: {
  node: TSESTree.ThisExpression | TSESTree.JSXIdentifier | TSESTree.Identifier
  maxParent: TSESTree.Node
}): boolean {
  let functionParentNodes = computeParentNodesWithTypes({
    allowedTypes: [
      AST_NODE_TYPES.FunctionExpression,
      AST_NODE_TYPES.ArrowFunctionExpression,
      AST_NODE_TYPES.FunctionDeclaration,
    ],
    consecutiveOnly: false,
    maxParent,
    node,
  })

  return functionParentNodes.some(
    functionParentNode => !isNodeImmediatelyCalled(functionParentNode),
  )
}
