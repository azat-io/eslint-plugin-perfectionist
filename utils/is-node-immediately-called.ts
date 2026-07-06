import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Checks whether a node is the callee of a call or `new` expression.
 *
 * Used to treat immediately invoked function expressions as eagerly executed:
 * references inside their bodies are read as soon as the surrounding expression
 * is evaluated, unlike references inside deferred function bodies.
 *
 * @param node - The AST node to check.
 * @returns Whether the node is immediately called.
 */
export function isNodeImmediatelyCalled(node: TSESTree.Expression): boolean {
  let { parent } = node
  return (
    (parent.type === AST_NODE_TYPES.CallExpression ||
      parent.type === AST_NODE_TYPES.NewExpression) &&
    parent.callee === node
  )
}
