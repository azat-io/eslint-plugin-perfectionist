import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { NodeNameDetails } from '../types'

import { computeIdentifierNameDetails } from '../compute-identifier-name-details'

/**
 * Computes the name details of a method or property node.
 *
 * @param node - The method or property node to compute the name for.
 * @param sourceCode - The ESLint source code object.
 * @returns An object containing the name, whether it has a private hash, and
 *   the name without the starting hash.
 */
export function computeMethodOrPropertyNameDetails(
  node:
    | TSESTree.TSAbstractPropertyDefinition
    | TSESTree.TSAbstractMethodDefinition
    | TSESTree.TSAbstractAccessorProperty
    | TSESTree.PropertyDefinition
    | TSESTree.MethodDefinition
    | TSESTree.AccessorProperty,
  sourceCode: TSESLint.SourceCode,
): NodeNameDetails {
  switch (node.key.type) {
    case AST_NODE_TYPES.PrivateIdentifier:
    case AST_NODE_TYPES.Identifier:
    case AST_NODE_TYPES.Literal:
      return computeIdentifierNameDetails(node.key)
    default:
      return {
        nameWithoutStartingHash: sourceCode.getText(node.key),
        name: sourceCode.getText(node.key),
        hasPrivateHash: false,
      }
  }
}
