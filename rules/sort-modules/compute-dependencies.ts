import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortModulesNode } from './types'

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
 * @deprecated - To remove when experimental dependency detection is the only
 *   option.
 * @param node - The AST node to analyze.
 * @param dependencyDetection - The dependency detection strategy. Hard
 *   dependencies consider dependencies impacting compilation, while soft
 *   dependencies also consider type references.
 * @returns The names of the dependencies.
 */
export function computeDependencies(
  node: SortModulesNode,
  dependencyDetection: DependencyDetection,
): string[] {
  let dependencies: string[] = []
  checkNode(node)
  return dependencies

  function checkNode(
    nodeToCheck: TSESTree.Node,
    options?: { ignoreNextIdentifier: boolean },
  ): void {
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
      if (
        !options?.ignoreNextIdentifier &&
        nodeToCheck.type === AST_NODE_TYPES.Identifier
      ) {
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
      if ('property' in nodeToCheck) {
        checkNode(nodeToCheck.property)
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
      if ('checkType' in nodeToCheck) {
        checkNode(nodeToCheck.checkType)
      }
      if ('constraint' in nodeToCheck && nodeToCheck.constraint) {
        checkNode(nodeToCheck.constraint)
      }
      if ('declaration' in nodeToCheck && nodeToCheck.declaration) {
        checkNode(nodeToCheck.declaration)
      }
      if ('elementTypes' in nodeToCheck) {
        traverseNode(nodeToCheck.elementTypes)
      }
      if ('elementType' in nodeToCheck) {
        checkNode(nodeToCheck.elementType)
      }
      if ('extends' in nodeToCheck) {
        traverseNode(nodeToCheck.extends)
      }
      if ('extendsType' in nodeToCheck) {
        checkNode(nodeToCheck.extendsType)
      }
      if ('exprName' in nodeToCheck) {
        checkNode(nodeToCheck.exprName)
      }
      if ('falseType' in nodeToCheck) {
        checkNode(nodeToCheck.falseType)
      }
      if ('key' in nodeToCheck) {
        checkNode(nodeToCheck.key, { ignoreNextIdentifier: true })
      }
      if ('id' in nodeToCheck && nodeToCheck.id) {
        checkNode(nodeToCheck.id)
      }
      if ('implements' in nodeToCheck) {
        traverseNode(nodeToCheck.implements)
      }
      if ('indexType' in nodeToCheck) {
        checkNode(nodeToCheck.indexType)
      }
      if ('name' in nodeToCheck && typeof nodeToCheck.name !== 'string') {
        checkNode(nodeToCheck.name)
      }
      if ('objectType' in nodeToCheck) {
        checkNode(nodeToCheck.objectType)
      }
      if ('params' in nodeToCheck) {
        traverseNode(nodeToCheck.params, { ignoreNextIdentifier: true })
      }
      if ('returnType' in nodeToCheck && nodeToCheck.returnType) {
        checkNode(nodeToCheck.returnType)
      }
      if ('trueType' in nodeToCheck) {
        checkNode(nodeToCheck.trueType)
      }
      if ('typeAnnotation' in nodeToCheck && nodeToCheck.typeAnnotation) {
        checkNode(nodeToCheck.typeAnnotation)
      }
      if ('typeArguments' in nodeToCheck && nodeToCheck.typeArguments) {
        checkNode(nodeToCheck.typeArguments)
      }
      if ('typeName' in nodeToCheck) {
        checkNode(nodeToCheck.typeName)
      }
      if ('typeParameters' in nodeToCheck && nodeToCheck.typeParameters) {
        traverseNode(nodeToCheck.typeParameters)
      }
      if ('typeParameter' in nodeToCheck) {
        checkNode(nodeToCheck.typeParameter)
      }
      if ('types' in nodeToCheck) {
        traverseNode(nodeToCheck.types)
      }
    }
  }

  function traverseNode(
    nodeToTraverse: TSESTree.Node[] | TSESTree.Node,
    options?: { ignoreNextIdentifier: boolean },
  ): void {
    if (Array.isArray(nodeToTraverse)) {
      for (let nodeItem of nodeToTraverse) {
        traverseNode(nodeItem, options)
      }
    } else {
      checkNode(nodeToTraverse, options)
    }
  }
}
