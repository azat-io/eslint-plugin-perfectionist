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
  switch (node.type) {
    case AST_NODE_TYPES.TSParameterProperty:
      return computeNodeName({ node: node.parameter, sourceCode })
    case AST_NODE_TYPES.AssignmentPattern:
      return computeNodeName({ node: node.left, sourceCode })
    case AST_NODE_TYPES.ObjectPattern:
    case AST_NODE_TYPES.ArrayPattern:
      return sourceCode.getText(node)
    case AST_NODE_TYPES.Identifier:
      return node.name
    /* v8 ignore next */
    default:
      throw new UnreachableCaseError(node)
  }
}
