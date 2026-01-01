import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { computeDependencyName } from './compute-dependency-name'

/**
 * Computes the set of class method dependency names from a class body node.
 *
 * Class methods should not be considered as dependencies because they can be
 * put in any order without causing a reference error.
 *
 * @param node - The class body node.
 * @returns The set of class method dependency names.
 */
export function computeClassMethodsDependencyNames(
  node: TSESTree.ClassBody,
): Set<string> {
  let dependencyNames = node.body
    .map(computeClassElementDependencyName)
    .filter(name => name !== null)

  return new Set(dependencyNames)
}

function computeClassElementDependencyName(
  classElement: TSESTree.ClassElement,
): string | null {
  switch (classElement.type) {
    case AST_NODE_TYPES.TSAbstractPropertyDefinition:
    case AST_NODE_TYPES.TSAbstractAccessorProperty:
    case AST_NODE_TYPES.PropertyDefinition:
    case AST_NODE_TYPES.AccessorProperty:
    case AST_NODE_TYPES.TSIndexSignature:
    case AST_NODE_TYPES.StaticBlock:
      return null
    case AST_NODE_TYPES.TSAbstractMethodDefinition:
    case AST_NODE_TYPES.MethodDefinition:
      if (!('name' in classElement.key)) {
        return null
      }
      return computeDependencyName({
        isPrivateHash:
          classElement.key.type === AST_NODE_TYPES.PrivateIdentifier,
        nodeNameWithoutStartingHash: classElement.key.name,
        isStatic: classElement.static,
      })
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(classElement)
  }
}
