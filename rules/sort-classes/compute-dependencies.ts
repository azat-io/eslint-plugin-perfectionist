import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { RegexOption } from '../../types/common-options'

import { computeIdentifierNameDetails } from './compute-identifier-name-details'
import { computeDependencyName } from './compute-dependency-name'
import { matches } from '../../utils/matches'

/**
 * Computes the dependencies of a class member AST node.
 *
 * @deprecated - To remove when experimental dependency detection is the only.
 * @param params - Parameters object.
 * @param params.ignoreCallbackDependenciesPatterns - Patterns to ignore
 *   callback dependencies.
 * @param params.useExperimentalDependencyDetection - Whether to use
 *   experimental dependency detection.
 * @param params.isMemberStatic - Indicates if the member is static.
 * @param params.expression - The AST node expression to analyze.
 * @param params.className - The name of the class, if available.
 * @returns The names of the dependencies.
 */
export function computeDependencies({
  ignoreCallbackDependenciesPatterns,
  useExperimentalDependencyDetection,
  isMemberStatic,
  expression,
  className,
}: {
  expression: TSESTree.StaticBlock | TSESTree.Expression
  ignoreCallbackDependenciesPatterns: RegexOption
  useExperimentalDependencyDetection: boolean
  className: undefined | string
  isMemberStatic: boolean
}): string[] {
  if (useExperimentalDependencyDetection) {
    return []
  }

  let dependencies: string[] = []
  traverseNode(expression)
  return dependencies

  function checkNode(nodeValue: TSESTree.Node): void {
    switch (nodeValue.type) {
      case AST_NODE_TYPES.ConditionalExpression:
        traverseNode(nodeValue.test)
        traverseNode(nodeValue.consequent)
        traverseNode(nodeValue.alternate)
        break
      case AST_NODE_TYPES.MemberExpression:
        dependencies.push(
          ...computeMemberExpressionDependencies({
            memberExpression: nodeValue,
            isMemberStatic,
            className,
          }),
        )
        break
      case AST_NODE_TYPES.CallExpression:
        if (!('name' in nodeValue.callee)) {
          traverseNode(nodeValue.arguments)
          break
        }
        if (
          matches(nodeValue.callee.name, ignoreCallbackDependenciesPatterns)
        ) {
          break
        }
        traverseNode(nodeValue.arguments)
        break
      case AST_NODE_TYPES.NewExpression:
        traverseNode(nodeValue.arguments)
        break
      case AST_NODE_TYPES.Property:
        traverseNode(nodeValue.key)
        traverseNode(nodeValue.value)
        break
      default:
        break
    }

    if ('argument' in nodeValue && nodeValue.argument) {
      traverseNode(nodeValue.argument)
    }
    if ('body' in nodeValue && nodeValue.body) {
      traverseNode(nodeValue.body)
    }
    if ('callee' in nodeValue) {
      traverseNode(nodeValue.callee)
    }
    if ('declarations' in nodeValue) {
      traverseNode(nodeValue.declarations)
    }
    if ('elements' in nodeValue) {
      let elements = nodeValue.elements.filter(
        currentNode => currentNode !== null,
      )
      traverseNode(elements)
    }
    if (
      'expression' in nodeValue &&
      typeof nodeValue.expression !== 'boolean'
    ) {
      traverseNode(nodeValue.expression)
    }
    if ('expressions' in nodeValue) {
      traverseNode(nodeValue.expressions)
    }
    if ('init' in nodeValue && nodeValue.init) {
      traverseNode(nodeValue.init)
    }
    if ('left' in nodeValue) {
      traverseNode(nodeValue.left)
    }
    if ('object' in nodeValue) {
      traverseNode(nodeValue.object)
    }
    if ('properties' in nodeValue) {
      traverseNode(nodeValue.properties)
    }
    if ('right' in nodeValue) {
      traverseNode(nodeValue.right)
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
}

function computeMemberExpressionDependencies({
  memberExpression,
  isMemberStatic,
  className,
}: {
  memberExpression: TSESTree.MemberExpression
  className: undefined | string
  isMemberStatic: boolean
}): string[] {
  switch (memberExpression.object.type) {
    case AST_NODE_TYPES.ThisExpression:
      return computeIdentifierOrThisExpressionDependencies()
    case AST_NODE_TYPES.Identifier:
      return memberExpression.object.name === className ?
          computeIdentifierOrThisExpressionDependencies()
        : []
    default:
      return []
  }

  function computeIdentifierOrThisExpressionDependencies(): string[] {
    let dependency = computeDependencyFromProperty()
    /* v8 ignore next 2 -- @preserve Unhandled cases */
    if (!dependency) {
      return []
    }
    return [dependency]
  }

  function computeDependencyFromProperty(): string | null {
    switch (memberExpression.property.type) {
      case AST_NODE_TYPES.PrivateIdentifier:
      case AST_NODE_TYPES.Identifier:
      case AST_NODE_TYPES.Literal: {
        let { nameWithoutStartingHash, hasPrivateHash } =
          computeIdentifierNameDetails(memberExpression.property)

        return computeDependencyName({
          isStatic:
            isMemberStatic ||
            memberExpression.object.type === AST_NODE_TYPES.Identifier,
          nodeNameWithoutStartingHash: nameWithoutStartingHash,
          hasPrivateHash,
        })
      }
      /* v8 ignore next 2 -- @preserve Unhandled cases */
      default:
        return null
    }
  }
}
