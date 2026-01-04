import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Checks if a node represents a style component.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a style component, false otherwise.
 */
export function isStyleComponent(
  node: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
): boolean {
  if (node.type === AST_NODE_TYPES.ObjectPattern) {
    return false
  }

  let objectRoot = getRootObject(node)

  if (isStyleNode(objectRoot.parent)) {
    return true
  }

  return (
    objectRoot.parent.type === AST_NODE_TYPES.ArrowFunctionExpression &&
    isStyleNode(objectRoot.parent.parent)
  )
}

function isStyleNode(node: TSESTree.Node): boolean {
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

function getRootObject(
  node: TSESTree.ObjectExpression,
): TSESTree.ObjectExpression {
  let objectRoot = node
  while (
    objectRoot.parent.type === AST_NODE_TYPES.Property &&
    objectRoot.parent.parent.type === AST_NODE_TYPES.ObjectExpression
  ) {
    objectRoot = objectRoot.parent.parent
  }
  return objectRoot
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
