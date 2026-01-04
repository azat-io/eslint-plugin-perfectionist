import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export function computeDependencies(
  expression: TSESTree.Expression,
  enumName: string,
): string[] {
  let dependencies: string[] = []
  let stack: TSESTree.Node[] = [expression]

  while (stack.length > 0) {
    let node = stack.pop()!
    if (
      node.type === AST_NODE_TYPES.MemberExpression &&
      node.object.type === AST_NODE_TYPES.Identifier &&
      node.object.name === enumName &&
      node.property.type === AST_NODE_TYPES.Identifier
    ) {
      dependencies.push(node.property.name)
    } else if (node.type === AST_NODE_TYPES.Identifier) {
      dependencies.push(node.name)
    }

    if ('left' in node) {
      stack.push(node.left)
    }
    if ('right' in node) {
      stack.push(node.right)
    }
    if ('expressions' in node) {
      stack.push(...node.expressions)
    }
  }

  return dependencies
}
