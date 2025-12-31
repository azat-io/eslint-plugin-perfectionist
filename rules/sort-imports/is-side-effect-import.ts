import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Determines whether the given AST node is a side-effect import.
 *
 * @param props - The parameters object.
 * @param props.sourceCode - ESLint source code object for text extraction.
 * @param props.node - The AST node representing an import-like declaration.
 * @returns True if the node is a side-effect import; otherwise, false.
 */
export function isSideEffectImport({
  sourceCode,
  node,
}: {
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration
  sourceCode: TSESLint.SourceCode
}): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.TSImportEqualsDeclaration:
    case AST_NODE_TYPES.VariableDeclaration:
      return false
    case AST_NODE_TYPES.ImportDeclaration:
      return (
        node.specifiers.length === 0 &&
        /* Avoid matching on named imports without specifiers */
        !/\}\s*from\s+/u.test(sourceCode.getText(node))
      )
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}
