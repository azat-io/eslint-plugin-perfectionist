import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

type Modifier = 'wildcard' | 'default' | 'named'

/**
 * Computes the specifier modifiers of an import-like AST node.
 *
 * @param node - The AST node representing an import-like declaration.
 * @returns A list of specifier modifiers.
 */
export function computeSpecifierModifiers(
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration,
): Modifier[] {
  if (node.type !== AST_NODE_TYPES.ImportDeclaration) {
    return []
  }

  return computeImportDeclarationModifiers(node)
}

function computeImportDeclarationModifiers(
  node: TSESTree.ImportDeclaration,
): Modifier[] {
  let importClauses = node.specifiers

  return [
    ...(hasSpecifier(importClauses, AST_NODE_TYPES.ImportDefaultSpecifier)
      ? ['default' as const]
      : []),
    ...(hasSpecifier(importClauses, AST_NODE_TYPES.ImportNamespaceSpecifier)
      ? ['wildcard' as const]
      : []),
    ...(hasSpecifier(importClauses, AST_NODE_TYPES.ImportSpecifier)
      ? ['named' as const]
      : []),
  ]
}

function hasSpecifier(
  importClauses: TSESTree.ImportClause[],
  specifier:
    | AST_NODE_TYPES.ImportNamespaceSpecifier
    | AST_NODE_TYPES.ImportDefaultSpecifier
    | AST_NODE_TYPES.ImportSpecifier,
): boolean {
  return importClauses.some(importClause => importClause.type === specifier)
}
