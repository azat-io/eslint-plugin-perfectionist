import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { NodeNameDetails } from './types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Computes the name details of an identifier.
 *
 * @param node - The node to compute the name details for.
 * @returns An object containing the name, whether it has a private hash, and
 *   the name without the starting hash.
 */
export function computeIdentifierNameDetails(
  node: TSESTree.PrivateIdentifier | TSESTree.Identifier | TSESTree.Literal,
): NodeNameDetails {
  switch (node.type) {
    case AST_NODE_TYPES.PrivateIdentifier:
      return {
        nameWithoutStartingHash: node.name,
        name: `#${node.name}`,
        hasPrivateHash: true,
      }
    case AST_NODE_TYPES.Identifier:
      return buildNonPrivateHashDetails(node.name)
    case AST_NODE_TYPES.Literal:
      return buildNonPrivateHashDetails(`${node.value}`)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function buildNonPrivateHashDetails(name: string): NodeNameDetails {
  return {
    nameWithoutStartingHash: name,
    hasPrivateHash: false,
    name,
  }
}
