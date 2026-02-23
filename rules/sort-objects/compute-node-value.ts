import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export function computeNodeValue({
  isDestructuredObject,
  sourceCode,
  property,
}: {
  sourceCode: TSESLint.SourceCode
  isDestructuredObject: boolean
  property: TSESTree.Property
}): string | null {
  switch (property.value.type) {
    case AST_NODE_TYPES.ArrowFunctionExpression:
    case AST_NODE_TYPES.FunctionExpression:
      return null
    case AST_NODE_TYPES.AssignmentPattern:
      switch (property.value.right.type) {
        case AST_NODE_TYPES.ArrowFunctionExpression:
        case AST_NODE_TYPES.FunctionExpression:
          return null
        default:
          return sourceCode.getText(property.value.right)
      }
    default:
      return isDestructuredObject ? null : sourceCode.getText(property.value)
  }
}
