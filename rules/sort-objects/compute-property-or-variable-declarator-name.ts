import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Compute the name for a property-like node.
 *
 * @param params - Parameters.
 * @param params.node - Starting node to search from.
 * @param params.sourceCode - The source code object.
 * @returns The property or variable declaration name.
 */
export function computePropertyOrVariableDeclaratorName({
  sourceCode,
  node,
}: {
  node: TSESTree.VariableDeclarator | TSESTree.Property
  sourceCode: TSESLint.SourceCode
}): string {
  switch (node.type) {
    case AST_NODE_TYPES.VariableDeclarator:
      return computeIdentifierName({ node: node.id, sourceCode })
    case AST_NODE_TYPES.Property:
      return computeIdentifierName({ node: node.key, sourceCode })
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function computeIdentifierName({
  sourceCode,
  node,
}: {
  node: TSESTree.VariableDeclarator['id'] | TSESTree.Property['key']
  sourceCode: TSESLint.SourceCode
}): string {
  switch (node.type) {
    case AST_NODE_TYPES.Identifier:
      return node.name
    case AST_NODE_TYPES.Literal:
      return `${node.value}`
    default:
      return sourceCode.getText(node)
  }
}
