import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

export function computeDependencies(
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration,
): string[] {
  switch (node.type) {
    case AST_NODE_TYPES.TSImportEqualsDeclaration:
      return computeImportEqualsDeclarationDependencies(node)
    case AST_NODE_TYPES.VariableDeclaration:
    case AST_NODE_TYPES.ImportDeclaration:
      return []
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function computeImportEqualsDeclarationDependencies(
  node: TSESTree.TSImportEqualsDeclaration,
): string[] {
  switch (node.moduleReference.type) {
    case AST_NODE_TYPES.TSExternalModuleReference:
    case AST_NODE_TYPES.Identifier:
      return []
    case AST_NODE_TYPES.TSQualifiedName: {
      let qualifiedName = getQualifiedNameDependencyName(node.moduleReference)
      /* v8 ignore if -- @preserve Unsure how we can reach that case */
      if (!qualifiedName) {
        return []
      }
      return [qualifiedName]
    }
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node.moduleReference)
  }
}

function getQualifiedNameDependencyName(
  node: TSESTree.EntityName,
): string | null {
  switch (node.type) {
    case AST_NODE_TYPES.TSQualifiedName:
      return getQualifiedNameDependencyName(node.left)
    /* v8 ignore next -- @preserve Unsure how we can reach that case */
    case AST_NODE_TYPES.ThisExpression:
      return null
    case AST_NODE_TYPES.Identifier:
      return node.name
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}
