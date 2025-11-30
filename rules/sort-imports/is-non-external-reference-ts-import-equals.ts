import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

export function isNonExternalReferenceTsImportEquals(
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration,
): node is TSESTree.TSImportEqualsDeclaration {
  if (node.type !== AST_NODE_TYPES.TSImportEqualsDeclaration) {
    return false
  }

  return node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference
}
