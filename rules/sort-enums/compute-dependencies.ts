import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Extract dependencies from an enum.
 *
 * @deprecated - To remove when experimental dependency detection is the only
 *   option.
 * @param expression - The enum or class declaration node.
 * @param enumName - The name of the enum being processed.
 * @returns The list of dependencies.
 */
export function computeDependencies(
  expression: TSESTree.Expression,
  enumName: string,
): string[] {
  let dependencies: string[] = []
  let stack: TSESTree.Node[] = [expression]

  while (stack.length > 0) {
    let node = stack.pop()!

    switch (node.type) {
      case AST_NODE_TYPES.MemberExpression:
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          node.object.name === enumName &&
          node.property.type === AST_NODE_TYPES.Identifier
        ) {
          dependencies.push(node.property.name)
        }
        break
      case AST_NODE_TYPES.Identifier:
        dependencies.push(node.name)
        break
      default:
        break
    }

    if ('alternate' in node && node.alternate) {
      stack.push(node.alternate)
    }
    if ('argument' in node && node.argument) {
      stack.push(node.argument)
    }
    if ('arguments' in node) {
      stack.push(...node.arguments)
    }
    if ('consequent' in node) {
      /* v8 ignore if -- @preserve Unsure if we can reach it. */
      if (Array.isArray(node.consequent)) {
        stack.push(...node.consequent)
      } else {
        stack.push(node.consequent)
      }
    }
    if ('elements' in node) {
      let elements = node.elements.filter(currentNode => currentNode !== null)
      stack.push(...elements)
    }
    if ('expressions' in node) {
      stack.push(...node.expressions)
    }
    if ('key' in node) {
      stack.push(node.key)
    }
    if ('left' in node) {
      stack.push(node.left)
    }
    if ('object' in node) {
      stack.push(node.object)
    }
    if ('properties' in node) {
      stack.push(...node.properties)
    }
    if ('right' in node) {
      stack.push(node.right)
    }
    if ('test' in node && node.test) {
      stack.push(node.test)
    }
    if (
      'value' in node &&
      node.value &&
      typeof node.value === 'object' &&
      'type' in node.value
    ) {
      stack.push(node.value)
    }
  }

  return dependencies
}
