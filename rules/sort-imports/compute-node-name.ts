import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

export function computeNodeName({
  sourceCode,
  node,
}: {
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration
  sourceCode: TSESLint.SourceCode
}): string {
  switch (node.type) {
    case AST_NODE_TYPES.TSImportEqualsDeclaration:
      return computeImportEqualsDeclarationName(node)
    case AST_NODE_TYPES.VariableDeclaration: {
      let callExpression = node.declarations[0].init as TSESTree.CallExpression
      let { value } = callExpression.arguments[0] as TSESTree.Literal
      return value!.toString()
    }
    case AST_NODE_TYPES.ImportDeclaration:
      return node.source.value
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }

  function computeImportEqualsDeclarationName(
    declaration: TSESTree.TSImportEqualsDeclaration,
  ): string {
    switch (declaration.moduleReference.type) {
      case AST_NODE_TYPES.TSExternalModuleReference:
        return declaration.moduleReference.expression.value
      case AST_NODE_TYPES.TSQualifiedName:
      case AST_NODE_TYPES.Identifier:
        return sourceCode.getText(declaration.moduleReference)
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(declaration.moduleReference)
    }
  }
}
