import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

export function computeSpecifierName({
  sourceCode,
  node,
}: {
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration
  sourceCode: TSESLint.SourceCode
}): string | null {
  switch (node.type) {
    case AST_NODE_TYPES.TSImportEqualsDeclaration:
      return node.id.name
    case AST_NODE_TYPES.VariableDeclaration:
      return computeVariableDeclarationSpecifierName(node, sourceCode)
    case AST_NODE_TYPES.ImportDeclaration:
      return computeImportDeclarationSpecifierName(node)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function computeVariableDeclarationSpecifierName(
  node: TSESTree.VariableDeclaration,
  sourceCode: TSESLint.SourceCode,
): string | null {
  let [declaration] = node.declarations

  switch (declaration.id.type) {
    case AST_NODE_TYPES.ObjectPattern:
      return computeObjectPatternPropertyName(declaration.id.properties[0])
    case AST_NODE_TYPES.ArrayPattern:
      if (!declaration.id.elements[0]) {
        return null
      }
      return sourceCode.getText(declaration.id.elements[0])
    case AST_NODE_TYPES.Identifier:
      return declaration.id.name
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(declaration.id)
  }

  function computeObjectPatternPropertyName(
    property: TSESTree.RestElement | TSESTree.Property | undefined,
  ): string | null {
    if (!property) {
      return null
    }
    switch (property.type) {
      case AST_NODE_TYPES.RestElement:
        return sourceCode.getText(property.argument)
      case AST_NODE_TYPES.Property:
        return sourceCode.getText(property.value)
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(property)
    }
  }
}

function computeImportDeclarationSpecifierName(
  node: TSESTree.ImportDeclaration,
): string | null {
  let [specifier] = node.specifiers
  if (!specifier) {
    return null
  }

  switch (specifier.type) {
    case AST_NODE_TYPES.ImportNamespaceSpecifier:
      return specifier.local.name
    case AST_NODE_TYPES.ImportDefaultSpecifier:
      return specifier.local.name
    case AST_NODE_TYPES.ImportSpecifier:
      return specifier.local.name
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(specifier)
  }
}
