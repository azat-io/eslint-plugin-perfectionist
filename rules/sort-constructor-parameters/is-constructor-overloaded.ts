import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Checks whether a constructor is part of an overload set or is a bodiless
 * signature.
 *
 * @param node - The constructor method definition to check.
 * @returns Whether the constructor is overloaded or bodiless.
 */
export function isConstructorOverloaded(
  node: TSESTree.MethodDefinition,
): boolean {
  switch (node.value.type) {
    case AST_NODE_TYPES.TSEmptyBodyFunctionExpression:
      return true
    case AST_NODE_TYPES.FunctionExpression:
      return node.parent.body.some(
        member =>
          member !== node &&
          member.type === AST_NODE_TYPES.MethodDefinition &&
          member.kind === 'constructor',
      )
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node.value)
  }
}
