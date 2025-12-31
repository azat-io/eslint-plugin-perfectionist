import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { RegexOption } from '../../types/common-options'

import { computeDependencyName } from './compute-dependency-name'
import { matches } from '../../utils/matches'

/**
 * Computes the dependencies of a class member AST node.
 *
 * @param params - Parameters object.
 * @param params.ignoreCallbackDependenciesPatterns - Patterns to ignore
 *   callback dependencies.
 * @param params.classMethodsDependencyNames - Set of class method dependency
 *   names.
 * @param params.isMemberStatic - Indicates if the member is static.
 * @param params.expression - The AST node expression to analyze.
 * @param params.className - The name of the class, if available.
 * @returns The names of the dependencies.
 */
export function computeDependencies({
  ignoreCallbackDependenciesPatterns,
  classMethodsDependencyNames,
  isMemberStatic,
  expression,
  className,
}: {
  expression: TSESTree.StaticBlock | TSESTree.Expression
  ignoreCallbackDependenciesPatterns: RegexOption
  classMethodsDependencyNames: Set<string>
  className: undefined | string
  isMemberStatic: boolean
}): string[] {
  let dependencies: string[] = []

  function checkNode(nodeValue: TSESTree.Node): void {
    switch (nodeValue.type) {
      case AST_NODE_TYPES.ConditionalExpression:
        traverseNode(nodeValue.test)
        traverseNode(nodeValue.consequent)
        traverseNode(nodeValue.alternate)
        break
      case AST_NODE_TYPES.MemberExpression:
        dependencies = [
          ...dependencies,
          ...computeMemberExpressionDependencies({
            classMethodsDependencyNames,
            memberExpression: nodeValue,
            isMemberStatic,
            className,
          }),
        ]
        break
      case AST_NODE_TYPES.Property:
        traverseNode(nodeValue.key)
        traverseNode(nodeValue.value)
        break
      default:
        break
    }

    if (
      'expression' in nodeValue &&
      typeof nodeValue.expression !== 'boolean'
    ) {
      traverseNode(nodeValue.expression)
    }

    if ('object' in nodeValue) {
      traverseNode(nodeValue.object)
    }

    if ('callee' in nodeValue) {
      traverseNode(nodeValue.callee)
    }

    if ('init' in nodeValue && nodeValue.init) {
      traverseNode(nodeValue.init)
    }

    if ('body' in nodeValue && nodeValue.body) {
      traverseNode(nodeValue.body)
    }

    if ('left' in nodeValue) {
      traverseNode(nodeValue.left)
    }

    if ('right' in nodeValue) {
      traverseNode(nodeValue.right)
    }

    if ('elements' in nodeValue) {
      let elements = nodeValue.elements.filter(
        currentNode => currentNode !== null,
      )
      traverseNode(elements)
    }

    if ('argument' in nodeValue && nodeValue.argument) {
      traverseNode(nodeValue.argument)
    }

    if ('arguments' in nodeValue) {
      let shouldIgnore = false
      if (nodeValue.type === AST_NODE_TYPES.CallExpression) {
        let functionName =
          'name' in nodeValue.callee ? nodeValue.callee.name : null
        shouldIgnore =
          functionName !== null &&
          matches(functionName, ignoreCallbackDependenciesPatterns)
      }
      if (!shouldIgnore) {
        traverseNode(nodeValue.arguments)
      }
    }

    if ('declarations' in nodeValue) {
      traverseNode(nodeValue.declarations)
    }

    if ('properties' in nodeValue) {
      traverseNode(nodeValue.properties)
    }

    if ('expressions' in nodeValue) {
      traverseNode(nodeValue.expressions)
    }
  }

  function traverseNode(nodeValue: TSESTree.Node[] | TSESTree.Node): void {
    if (Array.isArray(nodeValue)) {
      for (let nodeItem of nodeValue) {
        traverseNode(nodeItem)
      }
    } else {
      checkNode(nodeValue)
    }
  }

  traverseNode(expression)
  return dependencies
}

function computeMemberExpressionDependencies({
  classMethodsDependencyNames,
  memberExpression,
  isMemberStatic,
  className,
}: {
  memberExpression: TSESTree.MemberExpression
  classMethodsDependencyNames: Set<string>
  className: undefined | string
  isMemberStatic: boolean
}): string[] {
  switch (memberExpression.object.type) {
    case AST_NODE_TYPES.ThisExpression:
      return computeIdentifierOrThisExpressionDependencies()
    case AST_NODE_TYPES.Identifier:
      return memberExpression.object.name === className
        ? computeIdentifierOrThisExpressionDependencies()
        : []
    default:
      return []
  }

  function computeIdentifierOrThisExpressionDependencies(): string[] {
    let dependencyName = computePropertyDependencyName()
    if (!dependencyName) {
      return []
    }

    if (classMethodsDependencyNames.has(dependencyName)) {
      return []
    }
    return [dependencyName]
  }

  function computePropertyDependencyName(): string | null {
    switch (memberExpression.property.type) {
      case AST_NODE_TYPES.PrivateIdentifier:
      case AST_NODE_TYPES.Identifier:
        return computeDependencyName({
          isStatic:
            isMemberStatic ||
            memberExpression.object.type === AST_NODE_TYPES.Identifier,
          isPrivateHash:
            memberExpression.property.type === AST_NODE_TYPES.PrivateIdentifier,
          nodeNameWithoutStartingHash: memberExpression.property.name,
        })
      default:
        return null
    }
  }
}
