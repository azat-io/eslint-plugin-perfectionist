import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Computes the dependency names of an import-like AST node.
 *
 * @param props - The parameters object.
 * @param props.sourceCode - ESLint source code object for text extraction.
 * @param props.node - The AST node representing an import-like declaration.
 * @returns The names of the dependencies.
 */
export function computeDependencyNames({
  sourceCode,
  node,
}: {
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration
  sourceCode: TSESLint.SourceCode
}): string[] {
  switch (node.type) {
    case AST_NODE_TYPES.TSImportEqualsDeclaration:
      return [node.id.name]
    case AST_NODE_TYPES.VariableDeclaration:
      return []
    case AST_NODE_TYPES.ImportDeclaration:
      return node.specifiers.map(computeImportClauseDependencyName)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }

  function computeImportClauseDependencyName(
    specifier: TSESTree.ImportClause,
  ): string {
    switch (specifier.type) {
      case AST_NODE_TYPES.ImportNamespaceSpecifier:
      case AST_NODE_TYPES.ImportDefaultSpecifier:
        return sourceCode.getText(specifier.local)
      case AST_NODE_TYPES.ImportSpecifier:
        return sourceCode.getText(specifier.imported)
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(specifier)
    }
  }
}
