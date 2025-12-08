import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Checks if a node represents a style definition in JSX or styled-components.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a style definition, false otherwise.
 */
export function isStyleNode(node: TSESTree.Node): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.JSXExpressionContainer:
      return (
        node.parent.type === AST_NODE_TYPES.JSXAttribute &&
        node.parent.name.name === 'style'
      )
    case AST_NODE_TYPES.CallExpression:
      return (
        isCssCallExpression(node.callee) ||
        (node.callee.type === AST_NODE_TYPES.MemberExpression &&
          isStyledCallExpression(node.callee.object)) ||
        (node.callee.type === AST_NODE_TYPES.CallExpression &&
          isStyledCallExpression(node.callee.callee))
      )
    default:
      return false
  }
}

function isStyledCallExpression(identifier: TSESTree.Expression): boolean {
  return (
    identifier.type === AST_NODE_TYPES.Identifier &&
    identifier.name === 'styled'
  )
}

function isCssCallExpression(identifier: TSESTree.Expression): boolean {
  return (
    identifier.type === AST_NODE_TYPES.Identifier && identifier.name === 'css'
  )
}
