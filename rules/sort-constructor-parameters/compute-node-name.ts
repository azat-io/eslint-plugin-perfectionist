import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Computes the name of a constructor parameter.
 *
 * @param props - The parameters object.
 * @param props.sourceCode - ESLint source code object for text extraction.
 * @param props.node - The AST node representing a constructor parameter.
 * @returns The name of the constructor parameter.
 */
export function computeNodeName({
  sourceCode,
  node,
}: {
  node: Exclude<TSESTree.Parameter, TSESTree.RestElement>
  sourceCode: TSESLint.SourceCode
}): string {
  let nonParameterNorAssignmentNode =
    extractFirstNonParameterNorAssignmentNode(node)

  switch (nonParameterNorAssignmentNode.type) {
    case AST_NODE_TYPES.ObjectPattern:
    case AST_NODE_TYPES.ArrayPattern:
      return sourceCode.getText(nonParameterNorAssignmentNode)
    case AST_NODE_TYPES.Identifier:
      return nonParameterNorAssignmentNode.name
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(nonParameterNorAssignmentNode)
  }
}

function extractFirstNonParameterNorAssignmentNode(
  node: Exclude<TSESTree.Parameter, TSESTree.RestElement>,
): TSESTree.ObjectPattern | TSESTree.ArrayPattern | TSESTree.Identifier {
  let currentNode = node

  while (
    currentNode.type === AST_NODE_TYPES.TSParameterProperty ||
    currentNode.type === AST_NODE_TYPES.AssignmentPattern
  ) {
    currentNode =
      currentNode.type === AST_NODE_TYPES.TSParameterProperty ?
        currentNode.parameter
      : currentNode.left
  }

  return currentNode
}
