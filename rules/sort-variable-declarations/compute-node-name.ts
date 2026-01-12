import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortVariableDeclarationsNode } from './types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Computes the name of a variable declaration.
 *
 * @param props - The parameters object.
 * @param props.sourceCode - ESLint source code object for text extraction.
 * @param props.node - The AST node representing a variable declaration node.
 * @returns The name of the variable declaration node.
 */
export function computeNodeName({
  sourceCode,
  node,
}: {
  node: SortVariableDeclarationsNode
  sourceCode: TSESLint.SourceCode
}): string {
  switch (node.id.type) {
    case AST_NODE_TYPES.ObjectPattern:
    case AST_NODE_TYPES.ArrayPattern:
      return sourceCode.text.slice(...node.id.range)
    case AST_NODE_TYPES.Identifier:
      return node.id.name
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node.id)
  }
}
