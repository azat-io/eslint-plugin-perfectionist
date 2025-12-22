import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { isArrowFunctionNode } from './is-arrow-function-node'

interface HardDependencyDetection {
  searchStaticMethodsAndFunctionProperties: boolean
  type: 'hard'
}
interface SoftDependencyDetection {
  searchStaticMethodsAndFunctionProperties?: never
  type: 'soft'
}
type DependencyDetection = HardDependencyDetection | SoftDependencyDetection

/**
 * Computes the dependencies of a given AST node.
 *
 * @param node - The AST node to analyze.
 * @param dependencyDetection - The dependency detection strategy. Hard
 *   dependencies consider dependencies impacting compilation, while soft
 *   dependencies also consider type references.
 * @returns The names of the dependencies.
 */
export function computeDependencies(
  node: TSESTree.ClassDeclaration | TSESTree.TSEnumMember,
  dependencyDetection: DependencyDetection,
): string[] {
  let dependencies: string[] = []
  checkNode(node)
  return dependencies

  function checkNode(nodeToCheck: TSESTree.Node): void {
    switch (dependencyDetection.type) {
      case 'hard':
        if (
          (nodeToCheck.type === AST_NODE_TYPES.MethodDefinition ||
            isArrowFunctionNode(nodeToCheck)) &&
          (!nodeToCheck.static ||
            !dependencyDetection.searchStaticMethodsAndFunctionProperties)
        ) {
          return
        }
        break
      case 'soft':
        checkNodesForSoftDependencies()
        break
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(dependencyDetection)
    }

    checkNodesForCommonDependencies()

    function checkNodesForCommonDependencies(): void {
      if (nodeToCheck.type === AST_NODE_TYPES.Identifier) {
        dependencies.push(nodeToCheck.name)
      }
      if ('alternate' in nodeToCheck && nodeToCheck.alternate) {
        checkNode(nodeToCheck.alternate)
      }
      if ('argument' in nodeToCheck && nodeToCheck.argument) {
        checkNode(nodeToCheck.argument)
      }
      if ('arguments' in nodeToCheck) {
        traverseNode(nodeToCheck.arguments)
      }
      if ('body' in nodeToCheck && nodeToCheck.body) {
        traverseNode(nodeToCheck.body)
      }
      if ('callee' in nodeToCheck) {
        checkNode(nodeToCheck.callee)
      }
      if ('consequent' in nodeToCheck) {
        traverseNode(nodeToCheck.consequent)
      }
      if ('declarations' in nodeToCheck) {
        traverseNode(nodeToCheck.declarations)
      }
      if ('decorators' in nodeToCheck) {
        traverseNode(nodeToCheck.decorators)
      }
      if ('elements' in nodeToCheck) {
        let elements = nodeToCheck.elements.filter(
          currentNode => currentNode !== null,
        )
        traverseNode(elements)
      }
      if (
        'expression' in nodeToCheck &&
        typeof nodeToCheck.expression !== 'boolean'
      ) {
        checkNode(nodeToCheck.expression)
      }
      if ('expressions' in nodeToCheck) {
        traverseNode(nodeToCheck.expressions)
      }
      if ('init' in nodeToCheck && nodeToCheck.init) {
        checkNode(nodeToCheck.init)
      }
      if ('initializer' in nodeToCheck && nodeToCheck.initializer) {
        checkNode(nodeToCheck.initializer)
      }
      if ('left' in nodeToCheck) {
        checkNode(nodeToCheck.left)
      }
      if ('members' in nodeToCheck) {
        traverseNode(nodeToCheck.members)
      }
      if ('object' in nodeToCheck) {
        checkNode(nodeToCheck.object)
      }
      if ('properties' in nodeToCheck) {
        traverseNode(nodeToCheck.properties)
      }
      if ('right' in nodeToCheck) {
        checkNode(nodeToCheck.right)
      }
      if ('superClass' in nodeToCheck && nodeToCheck.superClass) {
        checkNode(nodeToCheck.superClass)
      }
      if ('test' in nodeToCheck && nodeToCheck.test) {
        checkNode(nodeToCheck.test)
      }
      if (
        'value' in nodeToCheck &&
        nodeToCheck.value &&
        typeof nodeToCheck.value === 'object' &&
        'type' in nodeToCheck.value
      ) {
        checkNode(nodeToCheck.value)
      }
    }

    function checkNodesForSoftDependencies(): void {
      // TODO
    }
  }

  function traverseNode(nodeToTraverse: TSESTree.Node[] | TSESTree.Node): void {
    if (Array.isArray(nodeToTraverse)) {
      for (let nodeItem of nodeToTraverse) {
        traverseNode(nodeItem)
      }
    } else {
      checkNode(nodeToTraverse)
    }
  }
}
