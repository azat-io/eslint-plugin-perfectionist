import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

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
