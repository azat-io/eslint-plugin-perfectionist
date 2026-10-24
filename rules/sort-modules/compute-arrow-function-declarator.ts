import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

interface ArrowFunctionDeclarator {
  init: TSESTree.ArrowFunctionExpression
  id: TSESTree.Identifier
}

/**
 * Computes the declarator of a `const` declaration that only declares an arrow
 * function, such as `const name = () => {}`.
 *
 * @param declaration - The variable declaration to inspect.
 * @returns The declarator, or null if the declaration declares anything else.
 */
export function computeArrowFunctionDeclarator(
  declaration: TSESTree.VariableDeclaration,
): ArrowFunctionDeclarator | null {
  if (
    declaration.kind !== 'const' ||
    declaration.declare ||
    declaration.declarations.length !== 1
  ) {
    return null
  }

  let declarator = declaration.declarations[0]!
  if (
    declarator.id.type !== AST_NODE_TYPES.Identifier ||
    declarator.init?.type !== AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return null
  }

  return {
    init: declarator.init,
    id: declarator.id,
  }
}
