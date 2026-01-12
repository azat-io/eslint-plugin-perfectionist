import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortVariableDeclarationsNode } from './types'

/**
 * Computes the dependencies of a variable declaration node.
 *
 * @param node - The AST node to analyze.
 * @returns The names of the dependencies.
 */
export function computeDependencies(
  node: SortVariableDeclarationsNode,
): string[] {
  return [
    ...computeExpressionDependencies(node.id),
    ...(node.init ? computeExpressionDependencies(node.init) : []),
  ]
}

function computeExpressionDependencies(
  expression: TSESTree.Expression,
): string[] {
  let dependencies: string[] = []

  checkNode(expression)

  return dependencies

  function checkNode(node: TSESTree.Node): void {
    switch (node.type) {
      /** No need to check the body of functions and arrow functions. */
      case AST_NODE_TYPES.ArrowFunctionExpression:
      case AST_NODE_TYPES.FunctionExpression:
        return
      case AST_NODE_TYPES.ConditionalExpression:
        checkNode(node.test)
        checkNode(node.consequent)
        checkNode(node.alternate)
        break
      case AST_NODE_TYPES.Identifier:
        dependencies.push(node.name)
        break
      case AST_NODE_TYPES.Property:
        checkNode(node.key)
        checkNode(node.value)
        break
    }

    if ('expression' in node && typeof node.expression !== 'boolean') {
      checkNode(node.expression)
    }

    if ('object' in node) {
      checkNode(node.object)
    }

    if ('callee' in node) {
      checkNode(node.callee)
    }

    if ('left' in node) {
      checkNode(node.left)
    }

    if ('right' in node) {
      checkNode(node.right)
    }

    if ('elements' in node) {
      let elements = node.elements.filter(currentNode => currentNode !== null)

      for (let element of elements) {
        checkNode(element)
      }
    }

    if ('argument' in node && node.argument) {
      checkNode(node.argument)
    }

    if ('arguments' in node) {
      for (let argument of node.arguments) {
        checkNode(argument)
      }
    }

    if ('properties' in node) {
      for (let property of node.properties) {
        checkNode(property)
      }
    }

    if ('expressions' in node) {
      for (let nodeExpression of node.expressions) {
        checkNode(nodeExpression)
      }
    }
  }
}
