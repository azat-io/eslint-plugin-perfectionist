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
    if (
      nodeValue.type === AST_NODE_TYPES.MemberExpression &&
      (nodeValue.object.type === AST_NODE_TYPES.ThisExpression ||
        (nodeValue.object.type === AST_NODE_TYPES.Identifier &&
          nodeValue.object.name === className)) &&
      (nodeValue.property.type === AST_NODE_TYPES.Identifier ||
        nodeValue.property.type === AST_NODE_TYPES.PrivateIdentifier)
    ) {
      let isStaticDependency =
        isMemberStatic || nodeValue.object.type === AST_NODE_TYPES.Identifier
      let dependencyName = computeDependencyName({
        isPrivateHash:
          nodeValue.property.type === AST_NODE_TYPES.PrivateIdentifier,
        nodeNameWithoutStartingHash: nodeValue.property.name,
        isStatic: isStaticDependency,
      })
      if (!classMethodsDependencyNames.has(dependencyName)) {
        dependencies.push(dependencyName)
      }
    }

    if (nodeValue.type === AST_NODE_TYPES.Property) {
      traverseNode(nodeValue.key)
      traverseNode(nodeValue.value)
    }

    if (nodeValue.type === AST_NODE_TYPES.ConditionalExpression) {
      traverseNode(nodeValue.test)
      traverseNode(nodeValue.consequent)
      traverseNode(nodeValue.alternate)
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
      for (let element of elements) {
        traverseNode(element)
      }
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
        for (let argument of nodeValue.arguments) {
          traverseNode(argument)
        }
      }
    }

    if ('declarations' in nodeValue) {
      for (let declaration of nodeValue.declarations) {
        traverseNode(declaration)
      }
    }

    if ('properties' in nodeValue) {
      for (let property of nodeValue.properties) {
        traverseNode(property)
      }
    }

    if ('expressions' in nodeValue) {
      for (let nodeExpression of nodeValue.expressions) {
        traverseNode(nodeExpression)
      }
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
