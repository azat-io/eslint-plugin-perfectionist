import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Computes the name of a class member.
 *
 * @param node - The method or property node to compute the name for.
 * @param sourceCode - The ESLint source code object.
 * @returns The computed name of the class member.
 */
export function computeNodeName(
  node: TSESTree.ClassElement,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (node.type) {
    case AST_NODE_TYPES.TSAbstractPropertyDefinition:
    case AST_NODE_TYPES.TSAbstractAccessorProperty:
    case AST_NODE_TYPES.TSAbstractMethodDefinition:
    case AST_NODE_TYPES.PropertyDefinition:
    case AST_NODE_TYPES.AccessorProperty:
    case AST_NODE_TYPES.MethodDefinition:
      return computeMethodOrPropertyName(node, sourceCode)
    case AST_NODE_TYPES.TSIndexSignature:
      return sourceCode.text.slice(
        node.range.at(0),
        node.typeAnnotation?.range.at(0) ?? node.range.at(1),
      )
    case AST_NODE_TYPES.StaticBlock:
      return 'static'
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function computeMethodOrPropertyName(
  method:
    | TSESTree.TSAbstractPropertyDefinition
    | TSESTree.TSAbstractMethodDefinition
    | TSESTree.TSAbstractAccessorProperty
    | TSESTree.PropertyDefinition
    | TSESTree.MethodDefinition
    | TSESTree.AccessorProperty,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (method.key.type) {
    case AST_NODE_TYPES.Identifier:
      return method.key.name
    case AST_NODE_TYPES.Literal:
      return `${method.key.value}`
    default:
      return sourceCode.getText(method.key)
  }
}
